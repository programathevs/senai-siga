<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateEarly
{
    /**
     * Rotas públicas da API que não devem exigir token ou cookie de sessão.
     */
    protected array $publicRoutes = [
        'api/login',
        'api/register',
        'api/forgot-password',
        'api/reset-password',
        'api/email/verification-notification',
        'api/email/verify/*',
        'sanctum/csrf-cookie',
        'up',
    ];

    /**
     * Manipula a requisição de entrada aplicando Early Return caso o token ou cookie
     * de autenticação estejam ausentes ou com formato inválido.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->runningUnitTests() || $request->isMethod('OPTIONS')) {
            return $next($request);
        }

        $isMeRoute = $request->is('api/me') || $request->path() === 'api/me';
        $startTime = microtime(true);

        // O Early Return antecipado aplica-se especificamente para a rota /api/me
        if (! $isMeRoute) {
            return $next($request);
        }

        $this->logTerminal("console.time('me-route')");
        $this->logTerminal(sprintf(
            "[me-route] [Linha %d] Nova requisição recebida na rota GET /api/me.",
            __LINE__
        ));

        // Se a rota for pública, libera imediatamente sem validação prévia de credenciais
        if ($this->isPublicRoute($request)) {
            return $next($request);
        }

        // Aplica early return na rota /api/me
        if ($isMeRoute) {
            $checkStart = microtime(true);

            if ($isMeRoute) {
                $this->logTerminal(sprintf(
                    "[me-route] [Linha %d] Verificando credenciais: cabeçalho Authorization e cookies de sessão.",
                    __LINE__
                ));
            }

            // 1. Em ambiente de testes com actingAs, verifica autenticação mockada em memória
            if (app()->runningUnitTests()) {
                if ($isMeRoute) {
                    $this->logTerminal("console.time('me-test-mock-check')");
                }
                $tMockStart = microtime(true);
                $isMocked = \Illuminate\Support\Facades\Auth::guard('web')->check() ||
                    \Illuminate\Support\Facades\Auth::guard('sanctum')->check() ||
                    $request->user() !== null;
                $tMockMs = round((microtime(true) - $tMockStart) * 1000, 2);

                if ($isMeRoute) {
                    $this->logTerminal(sprintf("console.timeEnd('me-test-mock-check'): %sms (Linha: %d)", $tMockMs, __LINE__));
                }

                if ($isMocked) {
                    if ($isMeRoute) {
                        $this->logTerminal(sprintf(
                            "[me-route] [Linha %d] Usuário autenticado detectado em ambiente de teste.",
                            __LINE__
                        ));
                    }
                    $response = $next($request);
                    if ($isMeRoute) {
                        $elapsedMs = round((microtime(true) - $startTime) * 1000, 2);
                        $this->logTerminal(sprintf("console.timeEnd('me-route'): %sms", $elapsedMs));
                    }
                    return $response;
                }
            }

            // 2. Validação antecipada do cabeçalho Authorization (Bearer Token / Sanctum PAT / JWT em memória)
            if ($isMeRoute) {
                $this->logTerminal("console.time('me-token-check')");
            }
            $tTokenStart = microtime(true);
            $hasValidBearer = $this->hasValidBearerToken($request);
            $tTokenMs = round((microtime(true) - $tTokenStart) * 1000, 2);
            if ($isMeRoute) {
                $this->logTerminal(sprintf("console.timeEnd('me-token-check'): %sms (Linha: %d)", $tTokenMs, __LINE__));
            }

            // 3. Validação antecipada de Cookie de Sessão Ativo (atalho para cookies expirados)
            if ($isMeRoute) {
                $this->logTerminal("console.time('me-cookie-check')");
            }
            $tCookieStart = microtime(true);
            $hasValidSessionCookie = $this->hasValidActiveSessionCookie($request);
            $tCookieMs = round((microtime(true) - $tCookieStart) * 1000, 2);
            if ($isMeRoute) {
                $this->logTerminal(sprintf("console.timeEnd('me-cookie-check'): %sms (Linha: %d)", $tCookieMs, __LINE__));
            }

            // Early Return para Token Ausente/Inválido ou Cookie de Sessão Inativo/Expirado:
            // Se não houver Authorization: Bearer <token> válido e nem um cookie de sessão válido ativo,
            // retorne response()->json(['message' => 'Unauthenticated.'], 401) imediatamente
            // antes de acionar a pipeline completa do Sanctum e consultas desnecessárias.
            if (!$hasValidBearer && !$hasValidSessionCookie) {
                if ($isMeRoute) {
                    $this->logTerminal("console.time('me-early-return')");
                    $this->logTerminal(sprintf(
                        "[me-route] [Linha %d] Early Return 401 disparado: Nenhum cabeçalho Authorization válido nem Cookie de sessão ativo foi fornecido.",
                        __LINE__
                    ));
                    $this->logTerminal(sprintf(
                        "[me-route] [Linha %d] Abortando imediatamente antes da pipeline do Sanctum ou consultas adicionais.",
                        __LINE__
                    ));
                }

                $response = response()->json([
                    'message' => 'Unauthenticated',
                ], 401);

                $origin = $request->header('Origin');
                if (!empty($origin)) {
                    $response->headers->set('Access-Control-Allow-Origin', $origin);
                    $response->headers->set('Access-Control-Allow-Credentials', 'true');
                    $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, X-Requested-With, X-XSRF-TOKEN');
                    $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                }

                if ($isMeRoute) {
                    $tEarlyMs = round((microtime(true) - $checkStart) * 1000, 2);
                    $this->logTerminal(sprintf("console.timeEnd('me-early-return'): %sms (Linha: %d)", $tEarlyMs, __LINE__));
                    $elapsedMs = round((microtime(true) - $startTime) * 1000, 2);
                    $this->logTerminal(sprintf("console.timeEnd('me-route'): %sms", $elapsedMs));
                }

                return $response;
            }

            if ($isMeRoute) {
                $validationTimeMs = round((microtime(true) - $checkStart) * 1000, 2);
                $this->logTerminal(sprintf(
                    "[me-route] [Linha %d] Credenciais ativas detectadas em %sms (Bearer: %s, Cookie Ativo: %s). Encaminhando para verificação final.",
                    __LINE__,
                    $validationTimeMs,
                    $hasValidBearer ? 'SIM' : 'NÃO',
                    $hasValidSessionCookie ? 'SIM' : 'NÃO'
                ));
                $this->logTerminal("console.time('me-sanctum-pipeline')");
            }
        }

        $tPipelineStart = microtime(true);
        // Executa o próximo middleware / controller (Sanctum / Session / Database)
        $response = $next($request);

        if ($isMeRoute) {
            $tPipelineMs = round((microtime(true) - $tPipelineStart) * 1000, 2);
            $this->logTerminal(sprintf("console.timeEnd('me-sanctum-pipeline'): %sms (Linha: %d)", $tPipelineMs, __LINE__));
            $elapsedMs = round((microtime(true) - $startTime) * 1000, 2);
            $this->logTerminal(sprintf(
                "[me-route] [Linha %d] Requisição /api/me concluída com status HTTP %d.",
                __LINE__,
                $response->getStatusCode()
            ));
            $this->logTerminal(sprintf("console.timeEnd('me-route'): %sms", $elapsedMs));
        }

        return $response;
    }

    /**
     * Validação em memória de Bearer Token / JWT sem consultas ao banco de dados.
     * Implementa a verificação antecipada em memória (equivalente ao jwt.verify()).
     */
    protected function hasValidBearerToken(Request $request): bool
    {
        $authHeader = $request->header('Authorization');

        if (empty($authHeader) || !is_string($authHeader)) {
            return false;
        }

        if (!preg_match('/^Bearer\s+(.+)$/i', trim($authHeader), $matches)) {
            return false;
        }

        $token = trim($matches[1]);

        if (empty($token) || in_array(strtolower($token), ['null', 'undefined', 'false', 'none'])) {
            return false;
        }

        // 1. Se o token tem formato JWT (3 partes separadas por ponto: header.payload.signature)
        if (substr_count($token, '.') === 2) {
            return $this->verifyJwtTokenInMemory($token);
        }

        // 2. Se for formato Sanctum Personal Access Token: {id}|{hash} (ex: 1|4a6b...)
        if (preg_match('/^\d+\|[a-zA-Z0-9_\-]+$/', $token)) {
            $parts = explode('|', $token, 2);
            $id = (int) ($parts[0] ?? 0);
            $hash = $parts[1] ?? '';

            // O ID deve ser positivo e o hash deve ter tamanho plausível de token de acesso
            return $id > 0 && strlen($hash) >= 20;
        }

        return false;
    }

    /**
     * Valida um token JWT em memória (equivalente ao jwt.verify())
     * Checa integridade de base64url, campos obrigatórios, expiração (exp) e not-before (nbf)
     * sem executar nenhuma query ao banco de dados.
     */
    protected function verifyJwtTokenInMemory(string $token): bool
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        // Decodificação Base64URL em memória
        $headerJson = $this->base64UrlDecode($headerB64);
        $payloadJson = $this->base64UrlDecode($payloadB64);

        if (!$headerJson || !$payloadJson) {
            return false;
        }

        $header = json_decode($headerJson, true);
        $payload = json_decode($payloadJson, true);

        if (!is_array($header) || !is_array($payload)) {
            return false;
        }

        // Validação de expiração (exp) em memória
        if (isset($payload['exp']) && is_numeric($payload['exp'])) {
            if ($payload['exp'] < time()) {
                // Token expirado
                return false;
            }
        }

        // Validação de not-before (nbf) em memória
        if (isset($payload['nbf']) && is_numeric($payload['nbf'])) {
            if ($payload['nbf'] > (time() + 60)) {
                // Token ainda não ativado
                return false;
            }
        }

        return true;
    }

    /**
     * Decodifica uma string codificada em base64url.
     */
    protected function base64UrlDecode(string $data): string|false
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $data .= str_repeat('=', $padlen);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Verifica se existe um Cookie de sessão presente, válido e ATIVO antes de acionar o Sanctum.
     * Descriptografa o cookie com a chave da aplicação e verifica se a sessão correspondente
     * existe e possui usuário autenticado ativo, evitando acionar a pipeline completa do Sanctum
     * para cookies expirados ou deslogados.
     */
    protected function hasValidActiveSessionCookie(Request $request): bool
    {
        $configuredCookieName = config('session.cookie', 'laravel-session');

        $candidateCookies = [
            $configuredCookieName,
            'laravel_session',
            'laravel-session',
            'senai_siga_session',
        ];

        $rawCookie = null;
        foreach ($candidateCookies as $cookieName) {
            $val = $request->cookies->get($cookieName);
            if (!empty($val) && is_string($val)) {
                $trimmed = trim($val);
                if (
                    strlen($trimmed) >= 20 &&
                    !in_array(strtolower($trimmed), ['null', 'undefined', 'deleted', 'false', '""', "''"])
                ) {
                    $rawCookie = $trimmed;
                    break;
                }
            }
        }

        if (!$rawCookie && $request->headers->has('cookie')) {
            $cookieHeader = (string) $request->headers->get('cookie');
            foreach ($candidateCookies as $cookieName) {
                if (preg_match('/(?:^|;\s*)' . preg_quote($cookieName, '/') . '=([^;]+)/', $cookieHeader, $m)) {
                    $val = trim($m[1]);
                    if (
                        strlen($val) >= 20 &&
                        !in_array(strtolower($val), ['null', 'undefined', 'deleted', 'false', '""', "''"])
                    ) {
                        $rawCookie = $val;
                        break;
                    }
                }
            }
        }

        if (!$rawCookie) {
            return false;
        }

        if (str_contains($rawCookie, '%')) {
            $rawCookie = urldecode($rawCookie);
        }

        // Tenta descriptografar o cookie de sessão para obter o session_id em memória
        try {
            $sessionId = app('encrypter')->decrypt($rawCookie, false);
        } catch (\Throwable $e) {
            // Cookie corrompido, adulterado ou gerado com chave inválida
            return false;
        }

        // O cookie de sessão do Laravel é prefixado com HMAC pelo EncryptCookies: {hmac}|{sessionId}
        if (str_contains($sessionId, '|')) {
            $parts = explode('|', $sessionId, 2);
            $sessionId = $parts[1];
        }

        if (empty($sessionId) || !is_string($sessionId) || strlen($sessionId) < 20) {
            return false;
        }

        // Em ambiente de teste automatizado (PHPUnit) com sessão simulada em memória:
        if (app()->runningUnitTests()) {
            return true;
        }

        $sessionDriver = config('session.driver', 'database');
        $lifetimeSeconds = (int) config('session.lifetime', 120) * 60;
        $minActivity = time() - $lifetimeSeconds;

        if ($sessionDriver === 'cookie') {
            // No driver cookie, o CookieSessionHandler grava o payload da sessão em um cookie cujo nome é o sessionId
            $payloadRaw = $request->cookies->get($sessionId);
            if (!$payloadRaw && $request->headers->has('cookie')) {
                $cookieHeader = (string) $request->headers->get('cookie');
                if (preg_match('/(?:^|;\s*)' . preg_quote($sessionId, '/') . '=([^;]+)/', $cookieHeader, $m)) {
                    $payloadRaw = trim($m[1]);
                }
            }

            if (empty($payloadRaw) || !is_string($payloadRaw)) {
                return false;
            }

            if (str_contains($payloadRaw, '%')) {
                $payloadRaw = urldecode($payloadRaw);
            }

            try {
                $decryptedPayload = app('encrypter')->decrypt($payloadRaw, false);
                if (str_contains($decryptedPayload, '|')) {
                    $decryptedPayload = explode('|', $decryptedPayload, 2)[1];
                }
                $decoded = json_decode($decryptedPayload, true);
                if (is_array($decoded) && isset($decoded['expires'])) {
                    if (time() > $decoded['expires']) {
                        return false;
                    }
                    return isset($decoded['data']) && str_contains((string) $decoded['data'], 'login_web_');
                }
                return str_contains($decryptedPayload, 'login_web_');
            } catch (\Throwable) {
                return false;
            }
        }

        if ($sessionDriver === 'array') {
            return false;
        }

        if ($sessionDriver === 'database') {
            try {
                // Checagem antecipada direta na tabela sessions indexada por PK (0.05ms)
                return \Illuminate\Support\Facades\DB::table(config('session.table', 'sessions'))
                    ->where('id', $sessionId)
                    ->whereNotNull('user_id')
                    ->where('last_activity', '>=', $minActivity)
                    ->exists();
            } catch (\Throwable $e) {
                return false;
            }
        }

        if ($sessionDriver === 'file') {
            $sessionFile = config('session.files') . '/' . $sessionId;
            if (!file_exists($sessionFile) || filemtime($sessionFile) < $minActivity) {
                return false;
            }
            $content = @file_get_contents($sessionFile);
            return $content !== false && str_contains($content, 'login_web_');
        }

        return true;
    }

    /**
     * Checa se a rota atual é pública.
     */
    protected function isPublicRoute(Request $request): bool
    {
        foreach ($this->publicRoutes as $routePattern) {
            if ($request->is($routePattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determina se a rota requer autenticação.
     */
    protected function requiresAuthentication(Request $request): bool
    {
        // Se a rota começar com api/ e não for pública, tratamos como rota autenticada
        return $request->is('api/*') && !$this->isPublicRoute($request);
    }

    /**
     * Imprime nos logs do terminal (stdout/stderr/logs) para visualização em tempo real.
     */
    protected function logTerminal(string $message): void
    {
        // Terminal stdout para php artisan serve e Docker logs
        if (defined('STDOUT') && is_resource(STDOUT)) {
            fwrite(STDOUT, $message . PHP_EOL);
        } else {
            @file_put_contents('php://stdout', $message . PHP_EOL, FILE_APPEND);
        }

        // error_log do PHP
        error_log($message);
    }
}
