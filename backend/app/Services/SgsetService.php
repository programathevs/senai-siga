<?php

namespace App\Services;

use App\Models\Aluno;
use App\Models\Curso;
use App\Models\Turma;
use App\Models\SgsetSyncLog;
use Carbon\Carbon;
use GuzzleHttp\Cookie\CookieJar;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use OpenSpout\Reader\XLSX\Reader;

class SgsetService
{
    protected string $sgsetBaseUrl = 'https://sgset.sp.senai.br';

    /**
     * Faz download direto da planilha de resultados do SGSET via HTTP em duas etapas.
     */
    public function baixarPlanilhaSgset(
        int $escola = 512,
        string $dataInicio = '01/01/2026',
        string $dataFim = '31/12/2050',
        int $chMin = 500,
        int $chMax = 3500,
        int $statusAluno = 1
    ): string {
        $cookieJar = new CookieJar();

        // Lista de colunas desejadas (dados do aluno, curso, turma e responsáveis)
        $colunas = '24,25,197,68,26,27,28,29,39,40,41,206,42,2,213,6,7,8,12,13,5,22,207';

        $xml = sprintf(
            '<Busca><Dados Colunas="%s" Esco="%d" DtaPrevDe="%s" DtaPrevAte="%s" DeCHTurma="%d" AteCHTurma="%d" StaAluno="%d" /><Ordem Colunas="" /></Busca>',
            $colunas,
            $escola,
            $dataInicio,
            $dataFim,
            $chMin,
            $chMax,
            $statusAluno
        );

        // Etapa 1: Enviar filtros e iniciar a consulta no ASP.NET
        $response1 = Http::withOptions(['cookies' => $cookieJar])
            ->timeout(60)
            ->get("{$this->sgsetBaseUrl}/Consultas/Resultado.aspx", [
                'Controle' => 6,
                'Visao' => 183,
                'Modo' => 'Analitico',
                'Xml' => $xml,
            ]);

        if (!$response1->successful()) {
            throw new \RuntimeException("Falha ao inicializar consulta no SGSET (HTTP {$response1->status()}).");
        }

        // Etapa 2: Exportar o resultado gerado em formato Excel (.xlsx)
        $response2 = Http::withOptions(['cookies' => $cookieJar])
            ->timeout(120)
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer' => "{$this->sgsetBaseUrl}/Consultas/Resultado.aspx",
            ])
            ->get("{$this->sgsetBaseUrl}/Consultas/ExportarResultado.aspx", [
                'valor' => 2,
            ]);

        if (!$response2->successful()) {
            throw new \RuntimeException("Falha ao exportar planilha do SGSET (HTTP {$response2->status()}).");
        }

        return $response2->body();
    }

    /**
     * Lê uma planilha XLSX a partir de um caminho de arquivo ou string binária e retorna as linhas associativas.
     */
    public function lerPlanilhaXlsx(string $caminhoOuBinario, bool $isBinario = false): array
    {
        $tempPath = null;
        if ($isBinario) {
            $tempPath = tempnam(sys_get_temp_dir(), 'sgset_') . '.xlsx';
            file_put_contents($tempPath, $caminhoOuBinario);
            $caminhoArquivo = $tempPath;
        } else {
            $caminhoArquivo = $caminhoOuBinario;
        }

        if (!file_exists($caminhoArquivo)) {
            throw new \InvalidArgumentException("Arquivo não encontrado: {$caminhoArquivo}");
        }

        $reader = new Reader();
        $reader->open($caminhoArquivo);

        $linhas = [];
        $cabecalhos = [];
        $isFirst = true;

        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $cells = $row->toArray();

                if ($isFirst) {
                    // Normaliza os cabeçalhos
                    $cabecalhos = array_map(function ($h) {
                        return trim((string)$h);
                    }, $cells);
                    $isFirst = false;
                    continue;
                }

                // Cria o array associativo usando os cabeçalhos
                $linha = [];
                foreach ($cabecalhos as $idx => $nomeCabecalho) {
                    if (!empty($nomeCabecalho)) {
                        $linha[$nomeCabecalho] = $cells[$idx] ?? null;
                    }
                }

                // Só adiciona se houver ao menos identificação do aluno (Nome ou Matrícula) ou turma
                if (!empty($linha['Nome']) || !empty($linha['Nº de Matrícula']) || !empty($linha['Turma'])) {
                    $linhas[] = $linha;
                }
            }
            break; // Lê apenas a primeira aba
        }

        $reader->close();

        if ($tempPath && file_exists($tempPath)) {
            @unlink($tempPath);
        }

        return $linhas;
    }

    /**
     * Importa alunos para a base do SIGA, com suporte à enturmação imediata ou posterior.
     */
    public function importarAlunos(array $linhas, bool $enturmarAutomaticamente = true): array
    {
        $resultado = [
            'total' => count($linhas),
            'criados' => 0,
            'atualizados' => 0,
            'inalterados' => 0,
            'erros' => [],
            'turmas_afetadas' => 0,
        ];

        $turmasCache = [];
        $cursosCache = [];
        $turmasAfetadasIds = [];

        DB::beginTransaction();
        try {
            foreach ($linhas as $index => $linha) {
                $matricula = trim((string)($linha['Nº de Matrícula'] ?? ''));
                $nome = trim((string)($linha['Nome'] ?? ''));
                $cpf = $this->limparDocumento($linha['CPF'] ?? null);

                if (empty($matricula) && empty($cpf)) {
                    $resultado['erros'][] = "Linha " . ($index + 2) . ": Sem matrícula ou CPF identificável ({$nome}).";
                    continue;
                }

                if (empty($nome)) {
                    $resultado['erros'][] = "Linha " . ($index + 2) . ": Nome do aluno não informado.";
                    continue;
                }

                $dataNasc = $this->parseData($linha['Data de Nascimento'] ?? null);
                $rg = trim((string)($linha['RG'] ?? '')) ?: null;
                $nomePai = trim((string)($linha['Nome do Pai'] ?? '')) ?: null;
                $nomeMae = trim((string)($linha['Nome da Mãe'] ?? '')) ?: null;
                $email = trim((string)($linha['e-mail'] ?? '')) ?: null;
                $emailEducacional = trim((string)($linha['E-mail Google Educacional'] ?? '')) ?: null;
                $telefone = trim((string)($linha['Celular'] ?? $linha['Telefone'] ?? '')) ?: null;
                $status = $this->mapearStatusAluno($linha['Situação do Aluno'] ?? 'Ativo');

                // 1. Busca aluno existente por Matrícula ou CPF
                $aluno = null;
                if (!empty($matricula)) {
                    $aluno = Aluno::where('matricula', $matricula)->first();
                }
                if (!$aluno && !empty($cpf)) {
                    $aluno = Aluno::where('cpf', $cpf)->first();
                }

                $dadosAluno = [
                    'nome' => $nome,
                    'matricula' => $matricula ?: ($aluno ? $aluno->matricula : null),
                    'cpf' => $cpf ?: ($aluno ? $aluno->cpf : null),
                    'rg' => $rg,
                    'data_nascimento' => $dataNasc,
                    'nome_pai' => $nomePai,
                    'nome_mae' => $nomeMae,
                    'email' => $email ?: ($aluno ? $aluno->email : null),
                    'email_educacional' => $emailEducacional,
                    'telefone' => $telefone ?: ($aluno ? $aluno->telefone : null),
                    'status' => $status,
                ];

                if (!$aluno) {
                    $aluno = Aluno::create($dadosAluno);
                    $resultado['criados']++;
                } else {
                    // Verifica se houve alteração real
                    $alterado = false;
                    foreach ($dadosAluno as $chave => $valor) {
                        $alunoVal = $aluno->{$chave};
                        if ($alunoVal instanceof \DateTimeInterface) {
                            $alunoVal = $alunoVal->format('Y-m-d');
                        }
                        if ($valor !== null && (string)$alunoVal !== (string)$valor) {
                            $alterado = true;
                            break;
                        }
                    }

                    if ($alterado) {
                        $aluno->update($dadosAluno);
                        $resultado['atualizados']++;
                    } else {
                        $resultado['inalterados']++;
                    }
                }

                // 2. Enturmação automática (se solicitada e se houver dados da turma)
                $siglaTurma = trim((string)($linha['Turma'] ?? ''));
                if ($enturmarAutomaticamente && !empty($siglaTurma)) {
                    $nomeCurso = trim((string)($linha['Curso'] ?? 'Curso Padrão'));
                    $turno = $this->normalizarTurno($linha['Turno'] ?? 'Integral');
                    $anoLetivo = $this->extrairAnoLetivo($linha['Data de Início'] ?? null, $linha['Data de Fim'] ?? null);
                    $semestreAtual = !empty($linha['Termo']) ? (int)$linha['Termo'] : 1;

                    // Cache ou Criação de Curso
                    if (!isset($cursosCache[$nomeCurso])) {
                        $curso = Curso::firstOrCreate(
                            ['nome' => $nomeCurso],
                            ['carga_horaria_total' => (int)($linha['Carga Horária'] ?? 1200)]
                        );
                        $cursosCache[$nomeCurso] = $curso;
                    }
                    $curso = $cursosCache[$nomeCurso];

                    // Cache ou Criação de Turma
                    $turmaKey = "{$curso->id}_{$siglaTurma}";
                    if (!isset($turmasCache[$turmaKey])) {
                        $turma = Turma::firstOrCreate(
                            [
                                'curso_id' => $curso->id,
                                'nome' => $siglaTurma,
                            ],
                            [
                                'turno' => $turno,
                                'ano_letivo' => $anoLetivo,
                                'semestre_atual' => $semestreAtual,
                            ]
                        );
                        $turmasCache[$turmaKey] = $turma;
                    }
                    $turma = $turmasCache[$turmaKey];
                    $turmasAfetadasIds[$turma->id] = true;

                    // Vincula na tabela pivô aluno_turmas sem duplicar
                    DB::table('aluno_turmas')->updateOrInsert(
                        [
                            'aluno_id' => $aluno->id,
                            'turma_id' => $turma->id,
                        ],
                        [
                            'ra' => $matricula ?: $aluno->matricula,
                            'status' => $status === 'ativo' ? 'ativo' : 'inativo',
                            'updated_at' => now(),
                        ]
                    );

                    // Atualiza turma_id no aluno caso esteja nulo (compatibilidade legada)
                    if (!$aluno->turma_id) {
                        $aluno->update(['turma_id' => $turma->id]);
                    }
                }
            }

            DB::commit();
            $resultado['turmas_afetadas'] = count($turmasAfetadasIds);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("[SGSET Alunos Import] Erro durante a importação: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }

        return $resultado;
    }

    /**
     * Importa apenas turmas e cursos a partir das linhas da planilha SGSET.
     */
    public function importarTurmas(array $linhas): array
    {
        $resultado = [
            'turmas_criadas' => 0,
            'turmas_atualizadas' => 0,
            'cursos_processados' => 0,
            'total_linhas' => count($linhas),
            'erros' => [],
        ];

        $cursosCache = [];
        $turmasProcessadas = [];

        DB::beginTransaction();
        try {
            foreach ($linhas as $linha) {
                $siglaTurma = trim((string)($linha['Turma'] ?? ''));
                $nomeCurso = trim((string)($linha['Curso'] ?? ''));

                if (empty($siglaTurma) || empty($nomeCurso)) {
                    continue;
                }

                $turno = $this->normalizarTurno($linha['Turno'] ?? 'Integral');
                $anoLetivo = $this->extrairAnoLetivo($linha['Data de Início'] ?? null, $linha['Data de Fim'] ?? null);
                $semestreAtual = !empty($linha['Termo']) ? (int)$linha['Termo'] : 1;
                $ch = (int)($linha['Carga Horária'] ?? $linha['Carga Horária da Turma'] ?? 1200);

                if (!isset($cursosCache[$nomeCurso])) {
                    $curso = Curso::firstOrCreate(
                        ['nome' => $nomeCurso],
                        ['carga_horaria_total' => $ch]
                    );
                    $cursosCache[$nomeCurso] = $curso;
                    $resultado['cursos_processados']++;
                }
                $curso = $cursosCache[$nomeCurso];

                $turmaKey = "{$curso->id}_{$siglaTurma}";
                if (isset($turmasProcessadas[$turmaKey])) {
                    continue;
                }
                $turmasProcessadas[$turmaKey] = true;

                $turma = Turma::where('curso_id', $curso->id)->where('nome', $siglaTurma)->first();

                if (!$turma) {
                    Turma::create([
                        'curso_id' => $curso->id,
                        'nome' => $siglaTurma,
                        'turno' => $turno,
                        'ano_letivo' => $anoLetivo,
                        'semestre_atual' => $semestreAtual,
                    ]);
                    $resultado['turmas_criadas']++;
                } else {
                    $turma->update([
                        'turno' => $turno,
                        'ano_letivo' => $anoLetivo,
                        'semestre_atual' => $semestreAtual,
                    ]);
                    $resultado['turmas_atualizadas']++;
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("[SGSET Turmas Import] Erro ao importar turmas: " . $e->getMessage());
            throw $e;
        }

        return $resultado;
    }

    /**
     * Sincronização geral (cursos, turmas e alunos) direto do SGSET ou via planilha.
     */
    public function sincronizarGeral(int $escola = 512, bool $enturmar = true, ?int $userId = null): array
    {
        $binario = $this->baixarPlanilhaSgset($escola);
        $linhas = $this->lerPlanilhaXlsx($binario, true);

        $resTurmas = $this->importarTurmas($linhas);
        $resAlunos = $this->importarAlunos($linhas, $enturmar);

        $resultado = [
            'escola' => $escola,
            'turmas' => $resTurmas,
            'alunos' => $resAlunos,
            'timestamp' => now()->toIso8601String(),
        ];

        SgsetSyncLog::create([
            'user_id' => $userId,
            'tipo' => 'geral',
            'origem' => 'sgset',
            'escola' => (string)$escola,
            'status' => 'sucesso',
            'detalhes' => $resultado,
        ]);

        return $resultado;
    }

    /**
     * Retorna o status da última sincronização realizada.
     */
    public function obterStatusUltimaSync(): ?array
    {
        $ultimoLog = SgsetSyncLog::with('user:id,name,email')
            ->latest('id')
            ->first();

        if (!$ultimoLog) {
            return null;
        }

        return [
            'id' => $ultimoLog->id,
            'tipo' => $ultimoLog->tipo,
            'origem' => $ultimoLog->origem,
            'escola' => $ultimoLog->escola,
            'status' => $ultimoLog->status,
            'usuario' => $ultimoLog->user ? $ultimoLog->user->name : 'Sistema',
            'data_hora' => $ultimoLog->created_at->format('d/m/Y H:i:s'),
            'detalhes' => $ultimoLog->detalhes,
        ];
    }

    // ─── Métodos Auxiliares de Sanitização ──────────────────────────────────────

    protected function limparDocumento(?string $doc): ?string
    {
        if (!$doc) return null;
        $limpo = preg_replace('/\D/', '', $doc);
        if (strlen($limpo) === 11) {
            // Formata CPF: 000.000.000-00
            return preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $limpo);
        }
        return $doc;
    }

    protected function parseData(mixed $valor): ?string
    {
        if (!$valor) return null;

        if ($valor instanceof \DateTimeInterface) {
            return $valor->format('Y-m-d');
        }

        $str = trim((string)$valor);
        if (empty($str)) return null;

        // Se contiver barra (DD/MM/YYYY)
        if (str_contains($str, '/')) {
            $parts = explode('/', $str);
            if (count($parts) === 3) {
                // DD/MM/YYYY
                if (strlen($parts[2]) === 4) {
                    return sprintf('%04d-%02d-%02d', $parts[2], $parts[1], $parts[0]);
                }
                // MM/DD/YY (formato americano)
                if (strlen($parts[2]) === 2) {
                    return sprintf('20%02d-%02d-%02d', $parts[2], $parts[0], $parts[1]);
                }
            }
        }

        try {
            return Carbon::parse($str)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    protected function mapearStatusAluno(mixed $status): string
    {
        $s = mb_strtolower(trim((string)$status));
        if ($s === '1' || str_contains($s, 'ativo') || str_contains($s, 'matriculado')) {
            return 'ativo';
        }
        if ($s === '5' || str_contains($s, 'conclu')) {
            return 'inativo';
        }
        if ($s === '21' || str_contains($s, 'canc') || str_contains($s, 'evas') || str_contains($s, 'transf')) {
            return 'transferido';
        }
        return 'ativo';
    }

    protected function normalizarTurno(mixed $turno): string
    {
        $t = mb_strtolower(trim((string)$turno));
        if (str_contains($t, 'manh')) return 'manha';
        if (str_contains($t, 'tard')) return 'tarde';
        if (str_contains($t, 'noit')) return 'noite';
        return 'integral';
    }

    protected function extrairAnoLetivo(mixed $inicio, mixed $fim): string
    {
        $dataInicio = $this->parseData($inicio);
        if ($dataInicio) {
            return substr($dataInicio, 0, 4);
        }
        $dataFim = $this->parseData($fim);
        if ($dataFim) {
            return substr($dataFim, 0, 4);
        }
        return (string)date('Y');
    }
}
