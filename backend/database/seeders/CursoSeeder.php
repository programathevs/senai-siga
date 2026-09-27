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
                ['nome' => 'Lógica de Programação e Algoritmos', 'carga_horaria' => 75, 'semestre_plano_3' => 1],
                ['nome' => 'Sistemas Operacionais', 'carga_horaria' => 90, 'semestre_plano_3' => 1],
                ['nome' => 'Arquitetura de Redes com IoT', 'carga_horaria' => 75, 'semestre_plano_3' => 1],
                ['nome' => 'Levantamento de Requisitos', 'carga_horaria' => 60, 'semestre_plano_3' => 1],
                ['nome' => 'Linguagem de Marcação I', 'carga_horaria' => 45, 'semestre_plano_3' => 1],
                ['nome' => 'Programação Back-End I', 'carga_horaria' => 55, 'semestre_plano_3' => 1],

                // 2º Semestre (400h)
                ['nome' => 'Linguagem de Marcação II', 'carga_horaria' => 30, 'semestre_plano_3' => 2],
                ['nome' => 'Banco de Dados', 'carga_horaria' => 75, 'semestre_plano_3' => 2],
                ['nome' => 'Programação Back-End II', 'carga_horaria' => 170, 'semestre_plano_3' => 2],
                ['nome' => 'Programação Front-End I', 'carga_horaria' => 80, 'semestre_plano_3' => 2],
                ['nome' => 'Projetos de Software I', 'carga_horaria' => 45, 'semestre_plano_3' => 2],

                // 3º Semestre (400h)
                ['nome' => 'Programação Front-End II', 'carga_horaria' => 70, 'semestre_plano_3' => 3],
                ['nome' => 'Programação para Dispositivos Móveis', 'carga_horaria' => 120, 'semestre_plano_3' => 3],
                ['nome' => 'Internet das Coisas (IoT)', 'carga_horaria' => 75, 'semestre_plano_3' => 3],
                ['nome' => 'Teste de Software', 'carga_horaria' => 45, 'semestre_plano_3' => 3],
                ['nome' => 'Projetos de Software II', 'carga_horaria' => 90, 'semestre_plano_3' => 3],
            ];

            foreach ($ucsP3 as $uc) {
                UnidadeCurricular::firstOrCreate(
                    ['curso_id' => $cursoP3->id, 'nome' => $uc['nome']],
                    [
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
                ['nome' => 'Lógica de Programação e Algoritmos', 'carga_horaria' => 75, 'semestre_plano_4' => 1],
                ['nome' => 'Sistemas Operacionais', 'carga_horaria' => 90, 'semestre_plano_4' => 1],
                ['nome' => 'Levantamento de Requisitos', 'carga_horaria' => 60, 'semestre_plano_4' => 1],
                ['nome' => 'Arquitetura de Redes com IoT', 'carga_horaria' => 75, 'semestre_plano_4' => 1],

                // 2º Semestre (300h)
                ['nome' => 'Banco de Dados', 'carga_horaria' => 75, 'semestre_plano_4' => 2],
                ['nome' => 'Linguagem de Marcação', 'carga_horaria' => 75, 'semestre_plano_4' => 2],
                ['nome' => 'Programação Back-End I', 'carga_horaria' => 105, 'semestre_plano_4' => 2],
                ['nome' => 'Projetos de Software I', 'carga_horaria' => 45, 'semestre_plano_4' => 2],

                // 3º Semestre (300h)
                ['nome' => 'Programação Back-End II', 'carga_horaria' => 120, 'semestre_plano_4' => 3],
                ['nome' => 'Programação Front-End I', 'carga_horaria' => 75, 'semestre_plano_4' => 3],
                ['nome' => 'Programação para Dispositivos Móveis I', 'carga_horaria' => 60, 'semestre_plano_4' => 3],
                ['nome' => 'Projetos de Software II', 'carga_horaria' => 45, 'semestre_plano_4' => 3],

                // 4º Semestre (300h)
                ['nome' => 'Programação Front-End II', 'carga_horaria' => 75, 'semestre_plano_4' => 4],
                ['nome' => 'Programação para Dispositivos Móveis II', 'carga_horaria' => 60, 'semestre_plano_4' => 4],
                ['nome' => 'Internet das Coisas (IoT)', 'carga_horaria' => 75, 'semestre_plano_4' => 4],
                ['nome' => 'Testes de Software', 'carga_horaria' => 45, 'semestre_plano_4' => 4],
                ['nome' => 'Projetos de Software III', 'carga_horaria' => 45, 'semestre_plano_4' => 4],
            ];

            foreach ($ucsP4 as $uc) {
                UnidadeCurricular::firstOrCreate(
                    ['curso_id' => $cursoP4->id, 'nome' => $uc['nome']],
                    [
                        'carga_horaria' => $uc['carga_horaria'],
                        'semestre_plano_3' => null,
                        'semestre_plano_4' => $uc['semestre_plano_4'],
                    ]
                );
            }
        });
    }
}
