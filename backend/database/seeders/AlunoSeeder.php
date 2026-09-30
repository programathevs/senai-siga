<?php

namespace Database\Seeders;

use App\Models\Aluno;
use App\Models\Turma;
use Illuminate\Database\Seeder;

class AlunoSeeder extends Seeder
{
    /**
     * Helper para formatar nome próprio em Title Case respeitando partículas em português.
     */
    private function formatarNomeProprio(string $nome): string
    {
        $nomeFormato = mb_convert_case(mb_strtolower($nome, 'UTF-8'), MB_CASE_TITLE, 'UTF-8');

        $search = [' De ', ' Da ', ' Do ', ' Dos ', ' Das ', ' E '];
        $replace = [' de ', ' da ', ' do ', ' dos ', ' das ', ' e '];

        return str_replace($search, $replace, $nomeFormato);
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $turmaI2HN = Turma::where('nome', 'DES-I2HN')->first();
        $turmaI1HNA = Turma::where('nome', 'DES-I1HNA')->first();
        $turmaM4H = Turma::where('nome', 'DES-M4H')->first();

        // 1. Turma DES-I2HN (32 alunos)
        $alunosI2HN = [
            ['matricula' => '25161435', 'nome' => 'Ana Caroline da Silva Novais', 'status' => 'ativo'],
            ['matricula' => '25161699', 'nome' => 'Ana Julia Monteiro Panizo', 'status' => 'ativo'],
            ['matricula' => '25161437', 'nome' => 'Ana Laura Bachega', 'status' => 'ativo'],
            ['matricula' => '25161439', 'nome' => 'Ana Livia Mondini', 'status' => 'ativo'],
            ['matricula' => '25161442', 'nome' => 'Beatriz Bonfim Machado', 'status' => 'ativo'],
            ['matricula' => '25161492', 'nome' => 'Beatriz Braga de Paula', 'status' => 'ativo'],
            ['matricula' => '25161540', 'nome' => 'Bianca da Silva Perez', 'status' => 'ativo'],
            ['matricula' => '25161510', 'nome' => 'Clara Cloe dos Santos Arcanjo', 'status' => 'ativo'],
            ['matricula' => '25161590', 'nome' => 'Eduardo Lucas de Oliveira', 'status' => 'ativo'],
            ['matricula' => '25161692', 'nome' => 'Gabriel Santos de Andrade', 'status' => 'ativo'],
            ['matricula' => '25161444', 'nome' => 'Guilherme Barboza Teixeira', 'status' => 'ativo'],
            ['matricula' => '25161446', 'nome' => 'Gustavo Alves de Sousa Moreira', 'status' => 'ativo'],
            ['matricula' => '25161448', 'nome' => 'Gustavo Matos Silva', 'status' => 'ativo'],
            ['matricula' => '25161450', 'nome' => 'Ícaro Moraes Silva', 'status' => 'ativo'],
            ['matricula' => '25161452', 'nome' => 'Laura Teodoro', 'status' => 'ativo'],
            ['matricula' => '25161454', 'nome' => 'Letícia Amaral Monari', 'status' => 'ativo'],
            ['matricula' => '25161498', 'nome' => 'Letícia Ribeiro', 'status' => 'ativo'],
            ['matricula' => '25161694', 'nome' => 'Letícia Xavier da Silva', 'status' => 'ativo'],
            ['matricula' => '25161502', 'nome' => 'Lucas Munhoz Penha', 'status' => 'ativo'],
            ['matricula' => '25161456', 'nome' => 'Lucas Perez Naitzki', 'status' => 'ativo'],
            ['matricula' => '25161458', 'nome' => 'Luiza dos Santos Silva', 'status' => 'ativo'],
            ['matricula' => '25161504', 'nome' => 'Marcello Augusto da Silva Santos', 'status' => 'ativo'],
            ['matricula' => '25161479', 'nome' => 'Maria Clara Ferreira Carvalho', 'status' => 'ativo'],
            ['matricula' => '25161462', 'nome' => 'Matheus Henrique da Silveira Miguel', 'status' => 'ativo'],
            ['matricula' => '25161506', 'nome' => 'Maylla Fátima Moreira de Morais', 'status' => 'ativo'],
            ['matricula' => '25161550', 'nome' => 'Milena Borges da Silva', 'status' => 'ativo'],
            ['matricula' => '25161726', 'nome' => 'Paulo Roberto Regiani Júnior', 'status' => 'ativo'],
            ['matricula' => '25161483', 'nome' => 'Pedro Gabriel Bettim', 'status' => 'ativo'],
            ['matricula' => '25161696', 'nome' => 'Pietro Schiavinato', 'status' => 'ativo'],
            ['matricula' => '25161548', 'nome' => 'Rafael Lima de Souza', 'status' => 'ativo'],
            ['matricula' => '25161465', 'nome' => 'Renato Guilherme Silvino Santana', 'status' => 'ativo'],
            ['matricula' => '25161690', 'nome' => 'Thuanny Borim Pereira', 'status' => 'ativo'],
        ];

        if ($turmaI2HN) {
            foreach ($alunosI2HN as $alunoData) {
                Aluno::updateOrCreate(
                    ['matricula' => $alunoData['matricula']],
                    [
                        'turma_id' => $turmaI2HN->id,
                        'nome' => $this->formatarNomeProprio($alunoData['nome']),
                        'email' => $alunoData['matricula'] . '@aluno.senai.br',
                        'status' => $alunoData['status'],
                    ]
                );
            }
        }

        // 2. Turma DES-I1HNA (32 ativos + 3 cancelados/inativos)
        $alunosI1HNA = [
            ['matricula' => '26170543', 'nome' => 'Ana Clara dos Reis', 'status' => 'ativo'],
            ['matricula' => '26168261', 'nome' => 'Ana Clara Schultz da Silva', 'status' => 'ativo'],
            ['matricula' => '26168263', 'nome' => 'Ana Livia Furini da Silva', 'status' => 'ativo'],
            ['matricula' => '26168353', 'nome' => 'Anna Gabrielly de Queiroz Martins', 'status' => 'ativo'],
            ['matricula' => '26169042', 'nome' => 'Arielle da Silva Sena', 'status' => 'ativo'],
            ['matricula' => '26168461', 'nome' => 'Bruna Oliveira da Silva', 'status' => 'ativo'],
            ['matricula' => '26168337', 'nome' => 'Cauã Henrique dos Santos', 'status' => 'ativo'],
            ['matricula' => '26168220', 'nome' => 'Davi de Freitas Picone', 'status' => 'ativo'],
            ['matricula' => '26170574', 'nome' => 'Eduarda Beatriz Gonçalves da Silva', 'status' => 'ativo'],
            ['matricula' => '26168271', 'nome' => 'Eloy Felipe dos Santos Oliveira', 'status' => 'ativo'],
            ['matricula' => '26168506', 'nome' => 'Gabriel Nascimento Galbiati', 'status' => 'ativo'],
            ['matricula' => '26168414', 'nome' => 'Gabrielle Olimpio de Souza', 'status' => 'ativo'],
            ['matricula' => '26168578', 'nome' => 'Helena Frizoni de Castro', 'status' => 'ativo'],
            ['matricula' => '26168632', 'nome' => 'Julia Furtado', 'status' => 'ativo'],
            ['matricula' => '26168639', 'nome' => 'Christian Caputi', 'status' => 'ativo'],
            ['matricula' => '26168494', 'nome' => 'Julia Pezzato Justino', 'status' => 'ativo'],
            ['matricula' => '26168647', 'nome' => 'Leonardo Henrique Subires de Andrade', 'status' => 'ativo'],
            ['matricula' => '26168279', 'nome' => 'Lucas Miguel Fatinatti Vieira', 'status' => 'ativo'],
            ['matricula' => '26168643', 'nome' => 'Luis Felipe Souza da Mata', 'status' => 'ativo'],
            ['matricula' => '26170600', 'nome' => 'Luiz Gabriel Nascimento Magnos', 'status' => 'ativo'],
            ['matricula' => '26168281', 'nome' => 'Malika Melo Bertonha', 'status' => 'ativo'],
            ['matricula' => '26168498', 'nome' => 'Mayna Beatriz Barbosa', 'status' => 'ativo'],
            ['matricula' => '26168287', 'nome' => 'Miguel Novaes Toulouzas', 'status' => 'ativo'],
            ['matricula' => '26168500', 'nome' => 'Milena Aparecida Panizo Nascimento', 'status' => 'ativo'],
            ['matricula' => '26168508', 'nome' => 'Nicolas de Sousa Bani', 'status' => 'ativo'],
            ['matricula' => '26168504', 'nome' => 'Nícolas Duarte da Costa', 'status' => 'ativo'],
            ['matricula' => '26168289', 'nome' => 'Pedro Kaleb Paulino', 'status' => 'ativo'],
            ['matricula' => '26168463', 'nome' => 'Thiago Luiz Saldanha Lins', 'status' => 'ativo'],
            ['matricula' => '26168666', 'nome' => 'Víctor Hugo Gois de Paula', 'status' => 'ativo'],
            ['matricula' => '26168576', 'nome' => 'Vitor Gazola Ramos', 'status' => 'ativo'],
            ['matricula' => '26168465', 'nome' => 'Yago Kauan de Souza Nogueira', 'status' => 'ativo'],
            ['matricula' => '26168480', 'nome' => 'Yuri Oruam Camargo Neves', 'status' => 'ativo'],
            // Alunos com matrícula cancelada no diário (inativos)
            ['matricula' => '26168307', 'nome' => 'Ana Luiza Gonçalves Zuppello', 'status' => 'inativo'],
            ['matricula' => '26168640', 'nome' => 'Christian Caputi', 'status' => 'inativo'],
            ['matricula' => '26168496', 'nome' => 'Enzo Felipe Novaes', 'status' => 'inativo'],
        ];

        if ($turmaI1HNA) {
            foreach ($alunosI1HNA as $alunoData) {
                Aluno::updateOrCreate(
                    ['matricula' => $alunoData['matricula']],
                    [
                        'turma_id' => $turmaI1HNA->id,
                        'nome' => $this->formatarNomeProprio($alunoData['nome']),
                        'email' => $alunoData['matricula'] . '@aluno.senai.br',
                        'status' => $alunoData['status'],
                    ]
                );
            }
        }

        // 3. Turma DES-M4H (14 ativos + 1 evadido/inativo)
        $alunosM4H = [
            ['matricula' => '25162318', 'nome' => 'Cauan José Faveri Marreiros', 'status' => 'ativo'],
            ['matricula' => '25162312', 'nome' => 'Christopher Coimbra Monteiro', 'status' => 'ativo'],
            ['matricula' => '25162293', 'nome' => 'Gabriel Alves Nunes Pimentel', 'status' => 'ativo'],
            ['matricula' => '25162346', 'nome' => 'Gabriele Furlan Cavalcanti', 'status' => 'ativo'],
            ['matricula' => '25162289', 'nome' => 'Guilherme Muniz Claro', 'status' => 'ativo'],
            ['matricula' => '25162301', 'nome' => 'Helen Crystina Andrade de Souza', 'status' => 'ativo'],
            ['matricula' => '25162303', 'nome' => 'Iann Arthur Martaroli', 'status' => 'ativo'],
            ['matricula' => '25162310', 'nome' => 'Isabella de Souza Florentino', 'status' => 'ativo'],
            ['matricula' => '25162314', 'nome' => 'Juliana Vieira Silva', 'status' => 'ativo'],
            ['matricula' => '25162316', 'nome' => 'Lucas de Souza Ferreira', 'status' => 'ativo'],
            ['matricula' => '25162291', 'nome' => 'Manoela Leite de Campos', 'status' => 'ativo'],
            ['matricula' => '25162305', 'nome' => 'Maria Eduarda de Souza Bigati', 'status' => 'ativo'],
            ['matricula' => '25162295', 'nome' => 'Matheus de Santana Faria', 'status' => 'ativo'],
            ['matricula' => '25162287', 'nome' => 'Rafael Augusto Barros', 'status' => 'ativo'],
            // Aluno evadido no diário (inativo)
            ['matricula' => '25162269', 'nome' => 'Vivian Carazzatto Aleixo', 'status' => 'inativo'],
        ];

        if ($turmaM4H) {
            foreach ($alunosM4H as $alunoData) {
                Aluno::updateOrCreate(
                    ['matricula' => $alunoData['matricula']],
                    [
                        'turma_id' => $turmaM4H->id,
                        'nome' => $this->formatarNomeProprio($alunoData['nome']),
                        'email' => $alunoData['matricula'] . '@aluno.senai.br',
                        'status' => $alunoData['status'],
                    ]
                );
            }
        }
    }
}
