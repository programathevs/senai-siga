<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\UnidadeCurricular;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CursoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Técnico em Desenvolvimento de Sistemas - 3 Semestres (1.200h)
            $cursoP3 = Curso::firstOrCreate(
                ['nome' => 'Técnico em Desenvolvimento de Sistemas - 3 Semestres'],
                ['carga_horaria_total' => 1200]
            );

            $ucsP3 = [
                // 1º Semestre (400h)
                ['nome' => 'Lógica de Programação e Algoritmos', 'sigla' => 'LOPAL', 'carga_horaria' => 75, 'semestre_plano_3' => 1],
                ['nome' => 'Sistemas Operacionais', 'sigla' => 'SOP', 'carga_horaria' => 90, 'semestre_plano_3' => 1],
                ['nome' => 'Arquitetura de Redes com IoT', 'sigla' => 'ARI', 'carga_horaria' => 75, 'semestre_plano_3' => 1],
                ['nome' => 'Levantamento de Requisitos', 'sigla' => 'LER', 'carga_horaria' => 60, 'semestre_plano_3' => 1],
                ['nome' => 'Linguagem de Marcação I', 'sigla' => 'LIMA1', 'carga_horaria' => 45, 'semestre_plano_3' => 1],
                ['nome' => 'Programação Back-End I', 'sigla' => 'PBE1', 'carga_horaria' => 55, 'semestre_plano_3' => 1],

                // 2º Semestre (400h)
                ['nome' => 'Linguagem de Marcação II', 'sigla' => 'LIMA2', 'carga_horaria' => 30, 'semestre_plano_3' => 2],
                ['nome' => 'Banco de Dados', 'sigla' => 'BCD', 'carga_horaria' => 75, 'semestre_plano_3' => 2],
                ['nome' => 'Programação Back-End II', 'sigla' => 'PBE2', 'carga_horaria' => 170, 'semestre_plano_3' => 2],
                ['nome' => 'Programação Front-End I', 'sigla' => 'PEND1', 'carga_horaria' => 80, 'semestre_plano_3' => 2],
                ['nome' => 'Projetos de Software I', 'sigla' => 'PSOF1', 'carga_horaria' => 45, 'semestre_plano_3' => 2],

                // 3º Semestre (400h)
                ['nome' => 'Programação Front-End II', 'sigla' => 'PEND2', 'carga_horaria' => 70, 'semestre_plano_3' => 3],
                ['nome' => 'Programação para Dispositivos Móveis', 'sigla' => 'PPDM', 'carga_horaria' => 120, 'semestre_plano_3' => 3],
                ['nome' => 'Internet das Coisas (IoT)', 'sigla' => 'ITCOI', 'carga_horaria' => 75, 'semestre_plano_3' => 3],
                ['nome' => 'Teste de Software', 'sigla' => 'TSOF', 'carga_horaria' => 45, 'semestre_plano_3' => 3],
                ['nome' => 'Projetos de Software II', 'sigla' => 'PSOF2', 'carga_horaria' => 90, 'semestre_plano_3' => 3],
            ];

            foreach ($ucsP3 as $uc) {
                UnidadeCurricular::updateOrCreate(
                    ['curso_id' => $cursoP3->id, 'nome' => $uc['nome']],
                    [
                        'sigla' => $uc['sigla'],
                        'carga_horaria' => $uc['carga_horaria'],
                        'semestre_plano_3' => $uc['semestre_plano_3'],
                        'semestre_plano_4' => null,
                    ]
                );
            }

            // 2. Técnico em Desenvolvimento de Sistemas - 4 Semestres (1.200h)
            $cursoP4 = Curso::firstOrCreate(
                ['nome' => 'Técnico em Desenvolvimento de Sistemas - 4 Semestres'],
                ['carga_horaria_total' => 1200]
            );

            $ucsP4 = [
                // 1º Semestre (300h)
                ['nome' => 'Lógica de Programação e Algoritmos', 'sigla' => 'LOPAL', 'carga_horaria' => 75, 'semestre_plano_4' => 1],
                ['nome' => 'Sistemas Operacionais', 'sigla' => 'SOP', 'carga_horaria' => 90, 'semestre_plano_4' => 1],
                ['nome' => 'Levantamento de Requisitos', 'sigla' => 'LER', 'carga_horaria' => 60, 'semestre_plano_4' => 1],
                ['nome' => 'Arquitetura de Redes com IoT', 'sigla' => 'ARI', 'carga_horaria' => 75, 'semestre_plano_4' => 1],

                // 2º Semestre (300h)
                ['nome' => 'Banco de Dados', 'sigla' => 'BCD', 'carga_horaria' => 75, 'semestre_plano_4' => 2],
                ['nome' => 'Linguagem de Marcação', 'sigla' => 'LIMA', 'carga_horaria' => 75, 'semestre_plano_4' => 2],
                ['nome' => 'Programação Back-End I', 'sigla' => 'PBE1', 'carga_horaria' => 105, 'semestre_plano_4' => 2],
                ['nome' => 'Projetos de Software I', 'sigla' => 'PSOF1', 'carga_horaria' => 45, 'semestre_plano_4' => 2],

                // 3º Semestre (300h)
                ['nome' => 'Programação Back-End II', 'sigla' => 'PBE2', 'carga_horaria' => 120, 'semestre_plano_4' => 3],
                ['nome' => 'Programação Front-End I', 'sigla' => 'PEND1', 'carga_horaria' => 75, 'semestre_plano_4' => 3],
                ['nome' => 'Programação para Dispositivos Móveis I', 'sigla' => 'PPDM1', 'carga_horaria' => 60, 'semestre_plano_4' => 3],
                ['nome' => 'Projetos de Software II', 'sigla' => 'PSOF2', 'carga_horaria' => 45, 'semestre_plano_4' => 3],

                // 4º Semestre (300h)
                ['nome' => 'Programação Front-End II', 'sigla' => 'PEND2', 'carga_horaria' => 75, 'semestre_plano_4' => 4],
                ['nome' => 'Programação para Dispositivos Móveis II', 'sigla' => 'PPDM2', 'carga_horaria' => 60, 'semestre_plano_4' => 4],
                ['nome' => 'Internet das Coisas (IoT)', 'sigla' => 'ITCOI', 'carga_horaria' => 75, 'semestre_plano_4' => 4],
                ['nome' => 'Testes de Software', 'sigla' => 'TSOF', 'carga_horaria' => 45, 'semestre_plano_4' => 4],
                ['nome' => 'Projetos de Software III', 'sigla' => 'PSOF3', 'carga_horaria' => 45, 'semestre_plano_4' => 4],
            ];

            foreach ($ucsP4 as $uc) {
                UnidadeCurricular::updateOrCreate(
                    ['curso_id' => $cursoP4->id, 'nome' => $uc['nome']],
                    [
                        'sigla' => $uc['sigla'],
                        'carga_horaria' => $uc['carga_horaria'],
                        'semestre_plano_3' => null,
                        'semestre_plano_4' => $uc['semestre_plano_4'],
                    ]
                );
            }

            // 3. Técnico em Desenvolvimento de Sistemas - SESI (1.200h)
            $cursoSESI = Curso::firstOrCreate(
                ['nome' => 'Técnico em Desenvolvimento de Sistemas - SESI'],
                ['carga_horaria_total' => 1200]
            );

            $ucsSESI = [
                // 1º Semestre
                ['nome' => 'Lógica de Programação e Algoritmos', 'sigla' => 'LOPAL', 'carga_horaria' => 75, 'semestre_plano_4' => 1],
                ['nome' => 'Sistemas Operacionais', 'sigla' => 'SOP', 'carga_horaria' => 90, 'semestre_plano_4' => 1],
                ['nome' => 'Levantamento de Requisitos', 'sigla' => 'LER', 'carga_horaria' => 60, 'semestre_plano_4' => 1],
                ['nome' => 'Arquitetura de Redes com IoT', 'sigla' => 'ARI', 'carga_horaria' => 75, 'semestre_plano_4' => 1],

                // 2º Semestre
                ['nome' => 'Banco de Dados', 'sigla' => 'BCD', 'carga_horaria' => 75, 'semestre_plano_4' => 2],
                ['nome' => 'Linguagem de Marcação', 'sigla' => 'LIMA', 'carga_horaria' => 75, 'semestre_plano_4' => 2],
                ['nome' => 'Programação Back-End I', 'sigla' => 'PBE1', 'carga_horaria' => 105, 'semestre_plano_4' => 2],
                ['nome' => 'Projetos de Software I', 'sigla' => 'PSOF1', 'carga_horaria' => 45, 'semestre_plano_4' => 2],

                // 3º Semestre
                ['nome' => 'Programação Back-End II', 'sigla' => 'PBE2', 'carga_horaria' => 120, 'semestre_plano_4' => 3],
                ['nome' => 'Programação Front-End', 'sigla' => 'PEND', 'carga_horaria' => 150, 'semestre_plano_4' => 3],
                ['nome' => 'Programação para Dispositivos Móveis', 'sigla' => 'PPDM', 'carga_horaria' => 120, 'semestre_plano_4' => 3],
                ['nome' => 'Projetos de Software', 'sigla' => 'PSOF2', 'carga_horaria' => 90, 'semestre_plano_4' => 3],

                // 4º Semestre
                ['nome' => 'Internet das Coisas (IoT)', 'sigla' => 'ITCOI', 'carga_horaria' => 75, 'semestre_plano_4' => 4],
                ['nome' => 'Testes de Software', 'sigla' => 'TSOF', 'carga_horaria' => 45, 'semestre_plano_4' => 4],
            ];

            foreach ($ucsSESI as $uc) {
                UnidadeCurricular::updateOrCreate(
                    ['curso_id' => $cursoSESI->id, 'nome' => $uc['nome']],
                    [
                        'sigla' => $uc['sigla'],
                        'carga_horaria' => $uc['carga_horaria'],
                        'semestre_plano_3' => null,
                        'semestre_plano_4' => $uc['semestre_plano_4'],
                    ]
                );
            }
        });
    }
}
