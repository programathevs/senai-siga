<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\Instrutor;
use App\Models\Turma;
use App\Models\UnidadeCurricular;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TurmaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Recupera os cursos
        $cursoP3 = Curso::where('nome', 'like', '%3 Semestres%')->first();
        $cursoP4 = Curso::where('nome', 'like', '%4 Semestres%')->first();
        $cursoSESI = Curso::where('nome', 'like', '%SESI%')->first();

        // Recupera o instrutor Matheus Luiz Oliveira de Camargo (Docente das 3 turmas nos diários)
        $userMatheus = User::where('email', 'matheus.decamargo@sp.senai.br')->first();
        $instrutorMatheus = $userMatheus ? Instrutor::where('user_id', $userMatheus->id)->first() : null;

        // Recupera outros docentes para co-docência
        $userFlorisvaldo = User::where('email', 'florisvaldo.crepaldi@sp.senai.br')->first();
        $instrutorFlorisvaldo = $userFlorisvaldo ? Instrutor::where('user_id', $userFlorisvaldo->id)->first() : null;

        $userIzaias = User::where('email', 'izaias.vieira@sp.senai.br')->first();
        $instrutorIzaias = $userIzaias ? Instrutor::where('user_id', $userIzaias->id)->first() : null;

        $userJefferson = User::where('email', 'jefferson.santos@sp.senai.br')->first();
        $instrutorJefferson = $userJefferson ? Instrutor::where('user_id', $userJefferson->id)->first() : null;

        // 1. Turma DES-I2HN (PDF 1: 1-2026-1-2026-DES-I2HN - 2º Termo Noturno / PBE2)
        if ($cursoP3) {
            $turmaI2HN = Turma::updateOrCreate(
                ['nome' => 'DES-I2HN'],
                [
                    'curso_id' => $cursoP3->id,
                    'turno' => 'Noite',
                    'ano_letivo' => '2026',
                    'semestre_atual' => 2,
                ]
            );

            if ($instrutorMatheus) {
                $turmaI2HN->instrutores()->syncWithoutDetaching(
                    array_filter([$instrutorMatheus->id, $instrutorFlorisvaldo?->id])
                );

                // Vincula UC PBE2
                $ucPBE2 = UnidadeCurricular::where('curso_id', $cursoP3->id)
                    ->where('sigla', 'PBE2')
                    ->first();

                if ($ucPBE2) {
                    DB::table('turma_uc')->updateOrInsert(
                        [
                            'turma_id' => $turmaI2HN->id,
                            'unidade_curricular_id' => $ucPBE2->id,
                            'semestre' => 2,
                        ],
                        [
                            'instrutor_id' => $instrutorMatheus->id,
                            'carga_horaria' => 160,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                }
            }
        }

        // 2. Turma DES-I1HNA (PDF 2: 1-2026-1-2026-DES-I1HNA - 1º Termo SESI / LIMA)
        if ($cursoSESI) {
            $turmaI1HNA = Turma::updateOrCreate(
                ['nome' => 'DES-I1HNA'],
                [
                    'curso_id' => $cursoSESI->id,
                    'turno' => 'Integral',
                    'ano_letivo' => '2026',
                    'semestre_atual' => 1,
                ]
            );

            if ($instrutorMatheus) {
                $turmaI1HNA->instrutores()->syncWithoutDetaching(
                    array_filter([$instrutorMatheus->id, $instrutorIzaias?->id])
                );

                // Vincula UC LIMA
                $ucLIMA = UnidadeCurricular::where('curso_id', $cursoSESI->id)
                    ->where('sigla', 'LIMA')
                    ->first();

                if ($ucLIMA) {
                    DB::table('turma_uc')->updateOrInsert(
                        [
                            'turma_id' => $turmaI1HNA->id,
                            'unidade_curricular_id' => $ucLIMA->id,
                            'semestre' => 1,
                        ],
                        [
                            'instrutor_id' => $instrutorMatheus->id,
                            'carga_horaria' => 100,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                }
            }
        }

        // 3. Turma DES-M4H (PDF 3: 2-2026-2-2026-DES-M4H - 4º Termo Manhã / PEND2)
        if ($cursoP4) {
            $turmaM4H = Turma::updateOrCreate(
                ['nome' => 'DES-M4H'],
                [
                    'curso_id' => $cursoP4->id,
                    'turno' => 'Manhã',
                    'ano_letivo' => '2026',
                    'semestre_atual' => 4,
                ]
            );

            if ($instrutorMatheus) {
                $turmaM4H->instrutores()->syncWithoutDetaching(
                    array_filter([$instrutorMatheus->id, $instrutorJefferson?->id])
                );

                // Vincula UC PEND2
                $ucPEND2 = UnidadeCurricular::where('curso_id', $cursoP4->id)
                    ->where('sigla', 'PEND2')
                    ->first();

                if ($ucPEND2) {
                    DB::table('turma_uc')->updateOrInsert(
                        [
                            'turma_id' => $turmaM4H->id,
                            'unidade_curricular_id' => $ucPEND2->id,
                            'semestre' => 4,
                        ],
                        [
                            'instrutor_id' => $instrutorMatheus->id,
                            'carga_horaria' => 100,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                }
            }
        }
    }
}
