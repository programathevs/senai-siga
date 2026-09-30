<?php

namespace Database\Seeders;

use App\Models\Aluno;
use App\Models\Turma;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AlunoSeeder extends Seeder
{
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
            ['matricula' => '25161435', 'nome' => 'ANA CAROLINE DA SILVA NOVAIS', 'status' => 'ativo'],
            ['matricula' => '25161699', 'nome' => 'ANA JULIA MONTEIRO PANIZO', 'status' => 'ativo'],
            ['matricula' => '25161437', 'nome' => 'ANA LAURA BACHEGA', 'status' => 'ativo'],
            ['matricula' => '25161439', 'nome' => 'ANA LIVIA MONDINI', 'status' => 'ativo'],
            ['matricula' => '25161442', 'nome' => 'BEATRIZ BONFIM MACHADO', 'status' => 'ativo'],
            ['matricula' => '25161492', 'nome' => 'BEATRIZ BRAGA DE PAULA', 'status' => 'ativo'],
            ['matricula' => '25161540', 'nome' => 'BIANCA DA SILVA PEREZ', 'status' => 'ativo'],
            ['matricula' => '25161510', 'nome' => 'CLARA CLOE DOS SANTOS ARCANJO', 'status' => 'ativo'],
            ['matricula' => '25161590', 'nome' => 'EDUARDO LUCAS DE OLIVEIRA', 'status' => 'ativo'],
            ['matricula' => '25161692', 'nome' => 'GABRIEL SANTOS DE ANDRADE', 'status' => 'ativo'],
            ['matricula' => '25161444', 'nome' => 'GUILHERME BARBOZA TEIXEIRA', 'status' => 'ativo'],
            ['matricula' => '25161446', 'nome' => 'GUSTAVO ALVES DE SOUSA MOREIRA', 'status' => 'ativo'],
            ['matricula' => '25161448', 'nome' => 'GUSTAVO MATOS SILVA', 'status' => 'ativo'],
            ['matricula' => '25161450', 'nome' => 'ÍCARO MORAES SILVA', 'status' => 'ativo'],
            ['matricula' => '25161452', 'nome' => 'LAURA TEODORO', 'status' => 'ativo'],
            ['matricula' => '25161454', 'nome' => 'LETÍCIA AMARAL MONARI', 'status' => 'ativo'],
            ['matricula' => '25161498', 'nome' => 'LETÍCIA RIBEIRO', 'status' => 'ativo'],
            ['matricula' => '25161694', 'nome' => 'LETÍCIA XAVIER DA SILVA', 'status' => 'ativo'],
            ['matricula' => '25161502', 'nome' => 'LUCAS MUNHOZ PENHA', 'status' => 'ativo'],
            ['matricula' => '25161456', 'nome' => 'LUCAS PEREZ NAITZKI', 'status' => 'ativo'],
            ['matricula' => '25161458', 'nome' => 'LUIZA DOS SANTOS SILVA', 'status' => 'ativo'],
            ['matricula' => '25161504', 'nome' => 'MARCELLO AUGUSTO DA SILVA SANTOS', 'status' => 'ativo'],
            ['matricula' => '25161479', 'nome' => 'MARIA CLARA FERREIRA CARVALHO', 'status' => 'ativo'],
            ['matricula' => '25161462', 'nome' => 'MATHEUS HENRIQUE DA SILVEIRA MIGUEL', 'status' => 'ativo'],
            ['matricula' => '25161506', 'nome' => 'MAYLLA FATIMA MOREIRA DE MORAIS', 'status' => 'ativo'],
            ['matricula' => '25161550', 'nome' => 'MILENA BORGES DA SILVA', 'status' => 'ativo'],
            ['matricula' => '25161726', 'nome' => 'PAULO ROBERTO REGIANI JÚNIOR', 'status' => 'ativo'],
            ['matricula' => '25161483', 'nome' => 'PEDRO GABRIEL BETTIM', 'status' => 'ativo'],
            ['matricula' => '25161696', 'nome' => 'PIETRO SCHIAVINATO', 'status' => 'ativo'],
            ['matricula' => '25161548', 'nome' => 'RAFAEL LIMA DE SOUZA', 'status' => 'ativo'],
            ['matricula' => '25161465', 'nome' => 'RENATO GUILHERME SILVINO SANTANA', 'status' => 'ativo'],
            ['matricula' => '25161690', 'nome' => 'THUANNY BORIM PEREIRA', 'status' => 'ativo'],
        ];

        if ($turmaI2HN) {
            foreach ($alunosI2HN as $alunoData) {
                Aluno::updateOrCreate(
                    ['matricula' => $alunoData['matricula']],
                    [
                        'turma_id' => $turmaI2HN->id,
                        'nome' => $alunoData['nome'],
                        'email' => $alunoData['matricula'] . '@aluno.senai.br',
                        'status' => $alunoData['status'],
                    ]
                );
            }
        }

        // 2. Turma DES-I1HNA (32 ativos + 3 cancelados/inativos)
        $alunosI1HNA = [
            ['matricula' => '26170543', 'nome' => 'ANA CLARA DOS REIS', 'status' => 'ativo'],
            ['matricula' => '26168261', 'nome' => 'ANA CLARA SCHULTZ DA SILVA', 'status' => 'ativo'],
            ['matricula' => '26168263', 'nome' => 'ANA LIVIA FURINI DA SILVA', 'status' => 'ativo'],
            ['matricula' => '26168353', 'nome' => 'ANNA GABRIELLY DE QUEIROZ MARTINS', 'status' => 'ativo'],
            ['matricula' => '26169042', 'nome' => 'ARIELLE DA SILVA SENA', 'status' => 'ativo'],
            ['matricula' => '26168461', 'nome' => 'BRUNA OLIVEIRA DA SILVA', 'status' => 'ativo'],
            ['matricula' => '26168337', 'nome' => 'CAUÃ HENRIQUE DOS SANTOS', 'status' => 'ativo'],
            ['matricula' => '26168220', 'nome' => 'DAVI DE FREITAS PICONE', 'status' => 'ativo'],
            ['matricula' => '26170574', 'nome' => 'EDUARDA BEATRIZ GONÇALVES DA SILVA', 'status' => 'ativo'],
            ['matricula' => '26168271', 'nome' => 'ELOY FELIPE DOS SANTOS OLIVEIRA', 'status' => 'ativo'],
            ['matricula' => '26168506', 'nome' => 'GABRIEL NASCIMENTO GALBIATI', 'status' => 'ativo'],
            ['matricula' => '26168414', 'nome' => 'GABRIELLE OLIMPIO DE SOUZA', 'status' => 'ativo'],
            ['matricula' => '26168578', 'nome' => 'HELENA FRIZONI DE CASTRO', 'status' => 'ativo'],
            ['matricula' => '26168632', 'nome' => 'JULIA FURTADO', 'status' => 'ativo'],
            ['matricula' => '26168639', 'nome' => 'CHRISTIAN CAPUTI', 'status' => 'ativo'],
            ['matricula' => '26168494', 'nome' => 'JULIA PEZZATO JUSTINO', 'status' => 'ativo'],
            ['matricula' => '26168647', 'nome' => 'LEONARDO HENRIQUE SUBIRES DE ANDRADE', 'status' => 'ativo'],
            ['matricula' => '26168279', 'nome' => 'LUCAS MIGUEL FATINATTI VIEIRA', 'status' => 'ativo'],
            ['matricula' => '26168643', 'nome' => 'LUIS FELIPE SOUZA DA MATA', 'status' => 'ativo'],
            ['matricula' => '26170600', 'nome' => 'LUIZ GABRIEL NASCIMENTO MAGNOS', 'status' => 'ativo'],
            ['matricula' => '26168281', 'nome' => 'MALIKA MELO BERTONHA', 'status' => 'ativo'],
            ['matricula' => '26168498', 'nome' => 'MAYNA BEATRIZ BARBOSA', 'status' => 'ativo'],
            ['matricula' => '26168287', 'nome' => 'MIGUEL NOVAES TOULOUZAS', 'status' => 'ativo'],
            ['matricula' => '26168500', 'nome' => 'MILENA APARECIDA PANIZO NASCIMENTO', 'status' => 'ativo'],
            ['matricula' => '26168508', 'nome' => 'NICOLAS DE SOUSA BANI', 'status' => 'ativo'],
            ['matricula' => '26168504', 'nome' => 'NÍCOLAS DUARTE DA COSTA', 'status' => 'ativo'],
            ['matricula' => '26168289', 'nome' => 'PEDRO KALEB PAULINO', 'status' => 'ativo'],
            ['matricula' => '26168463', 'nome' => 'THIAGO LUIZ SALDANHA LINS', 'status' => 'ativo'],
            ['matricula' => '26168666', 'nome' => 'VÍCTOR HUGO GOIS DE PAULA', 'status' => 'ativo'],
            ['matricula' => '26168576', 'nome' => 'VITOR GAZOLA RAMOS', 'status' => 'ativo'],
            ['matricula' => '26168465', 'nome' => 'YAGO KAUAN DE SOUZA NOGUEIRA', 'status' => 'ativo'],
            ['matricula' => '26168480', 'nome' => 'YURI ORUAM CAMARGO NEVES', 'status' => 'ativo'],
            // Alunos com matrícula cancelada no diário (inativos)
            ['matricula' => '26168307', 'nome' => 'ANA LUIZA GONÇALVES ZUPPELLO', 'status' => 'inativo'],
            ['matricula' => '26168640', 'nome' => 'CHRISTIAN CAPUTI', 'status' => 'inativo'],
            ['matricula' => '26168496', 'nome' => 'ENZO FELIPE NOVAES', 'status' => 'inativo'],
        ];

        if ($turmaI1HNA) {
            foreach ($alunosI1HNA as $alunoData) {
                Aluno::updateOrCreate(
                    ['matricula' => $alunoData['matricula']],
                    [
                        'turma_id' => $turmaI1HNA->id,
                        'nome' => $alunoData['nome'],
                        'email' => $alunoData['matricula'] . '@aluno.senai.br',
                        'status' => $alunoData['status'],
                    ]
                );
            }
        }

        // 3. Turma DES-M4H (14 ativos + 1 evadido/inativo)
        $alunosM4H = [
            ['matricula' => '25162318', 'nome' => 'CAUAN JOSÉ FAVERI MARREIROS', 'status' => 'ativo'],
            ['matricula' => '25162312', 'nome' => 'CHRISTOPHER COIMBRA MONTEIRO', 'status' => 'ativo'],
            ['matricula' => '25162293', 'nome' => 'GABRIEL ALVES NUNES PIMENTEL', 'status' => 'ativo'],
            ['matricula' => '25162346', 'nome' => 'GABRIELE FURLAN CAVALCANTI', 'status' => 'ativo'],
            ['matricula' => '25162289', 'nome' => 'GUILHERME MUNIZ CLARO', 'status' => 'ativo'],
            ['matricula' => '25162301', 'nome' => 'HELEN CRYSTINA ANDRADE DE SOUZA', 'status' => 'ativo'],
            ['matricula' => '25162303', 'nome' => 'IANN ARTHUR MARTAROLI', 'status' => 'ativo'],
            ['matricula' => '25162310', 'nome' => 'ISABELLA DE SOUZA FLORENTINO', 'status' => 'ativo'],
            ['matricula' => '25162314', 'nome' => 'JULIANA VIEIRA SILVA', 'status' => 'ativo'],
            ['matricula' => '25162316', 'nome' => 'LUCAS DE SOUZA FERREIRA', 'status' => 'ativo'],
            ['matricula' => '25162291', 'nome' => 'MANOELA LEITE DE CAMPOS', 'status' => 'ativo'],
            ['matricula' => '25162305', 'nome' => 'MARIA EDUARDA DE SOUZA BIGATI', 'status' => 'ativo'],
            ['matricula' => '25162295', 'nome' => 'MATHEUS DE SANTANA FARIA', 'status' => 'ativo'],
            ['matricula' => '25162287', 'nome' => 'RAFAEL AUGUSTO BARROS', 'status' => 'ativo'],
            // Aluno evadido no diário (inativo)
            ['matricula' => '25162269', 'nome' => 'VIVIAN CARAZZATTO ALEIXO', 'status' => 'inativo'],
        ];

        if ($turmaM4H) {
            foreach ($alunosM4H as $alunoData) {
                Aluno::updateOrCreate(
                    ['matricula' => $alunoData['matricula']],
                    [
                        'turma_id' => $turmaM4H->id,
                        'nome' => $alunoData['nome'],
                        'email' => $alunoData['matricula'] . '@aluno.senai.br',
                        'status' => $alunoData['status'],
                    ]
                );
            }
        }
    }
}
