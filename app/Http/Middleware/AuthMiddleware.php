<?php

namespace App\Http\Middleware;

use App\Services\UserRoleService;
use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

class AuthMiddleware
{
    protected UserRoleService $userRoleService;

    public function __construct(UserRoleService $userRoleService)
    {
        $this->userRoleService = $userRoleService;
    }

    public function handle(Request $request, Closure $next)
    {
        $cookieName = env('SSO_COOKIE_NAME', 'authify_suite_sso');
        $secure     = (bool) env('SESSION_SECURE_COOKIE', false);

        $tokenFromQuery   = $request->query('key');
        $tokenFromCookie  = $request->cookie($cookieName);
        $tokenFromSession = session('emp_data.token');

        $token = $tokenFromQuery ?? $tokenFromCookie ?? $tokenFromSession;

        if (!$token) {
            return $this->redirectToLogin($request);
        }

        // Session valid and token matches — skip decode entirely
        if (session()->has('emp_data') && session('emp_data.token') === $token) {
            if ($tokenFromQuery) {
                return redirect($request->fullUrlWithoutQuery(['key']))
                    ->withCookie($this->makeCookie($cookieName, $token, $secure));
            }
            return $next($request);
        }

        // Decode JWT
        try {
            $secret = env('JWT_SECRET');
            if (empty($secret)) {
                return $this->redirectToLogin($request);
            }

            $decoded = (array) JWT::decode(
                $token,
                new Key($secret, 'HS256')
            );
        } catch (\Firebase\JWT\ExpiredException $e) {
            session()->forget('emp_data');
            return $this->redirectToLogin($request)
                ->withCookie($this->forgetCookie($cookieName, $secure));
        } catch (\Exception $e) {
            session()->forget('emp_data');
            return $this->redirectToLogin($request)
                ->withCookie($this->forgetCookie($cookieName, $secure));
        }

        if (empty($decoded['emp_id'])) {
            session()->forget('emp_data');
            return $this->redirectToLogin($request)
                ->withCookie($this->forgetCookie($cookieName, $secure));
        }

        // Access control
        $canAccess = ($decoded['emp_position'] ?? 0) >= 2
            || stripos($decoded['emp_dept'] ?? '', 'Facilities') !== false;

        if (!$canAccess) {
            session()->forget('emp_data');
            $redirectUrl = urlencode(route('dashboard'));
            $authifyUrl  = env('AUTHIFY_URL') . "/logout?redirect={$redirectUrl}";
            return Inertia::render('Unauthorized', [
                'logoutUrl' => $authifyUrl,
                'message'   => 'Access Restricted.',
            ])->toResponse($request)->setStatusCode(403);
        }

        // Build system roles
        $systemRoles = [];
        $department  = $decoded['emp_dept'] ?? '';
        $jobTitle    = $decoded['emp_jobtitle'] ?? '';

        if ($department === 'Facilities' && stripos($jobTitle, 'Facility Engineer') === 0) {
            $systemRoles[] = 'Facilities_Coordinator';
        } elseif (stripos($department, 'Facilities') !== false) {
            $systemRoles[] = 'Facilities';
        }

        $userRoles = $this->userRoleService->getRole($decoded['emp_id']);

        session()->put('emp_data', [
            'token'         => $token,
            'emp_id'        => $decoded['emp_id'],
            'emp_name'      => $decoded['emp_name'],
            'emp_firstname' => $decoded['emp_firstname'],
            'emp_jobtitle'  => $decoded['emp_jobtitle'],
            'emp_dept'      => $decoded['emp_dept'],
            'emp_prodline'  => $decoded['emp_prodline'],
            'emp_station'   => $decoded['emp_station'],
            'emp_position'  => $decoded['emp_position'],
            'emp_from'      => $decoded['emp_from'] ?? 'Employee',
            'user_roles'    => $userRoles,
            'system_roles'  => $systemRoles,
            'generated_at'  => date('Y-m-d H:i:s', $decoded['iat']),
        ]);

        session()->save();

        $cookie = $this->makeCookie($cookieName, $token, $secure);

        if ($tokenFromQuery) {
            return redirect($request->fullUrlWithoutQuery(['key']))
                ->withCookie($cookie);
        }

        return $next($request)->withCookie($cookie);
    }

    private function makeCookie(string $name, string $value, bool $secure): SymfonyCookie
    {
        return SymfonyCookie::create(
            $name,
            $value,
            now()->addDays(7),
            '/',
            null,
            $secure,
            true,   // httpOnly
            false,
            'lax'
        );
    }

    private function forgetCookie(string $name, bool $secure): SymfonyCookie
    {
        return SymfonyCookie::create(
            $name, '', 1, '/', null,
            $secure,  // must match makeCookie exactly
            true, false, 'lax'
        );
    }

    private function redirectToLogin(Request $request)
    {
        $redirectUrl = urlencode($request->fullUrl());
        $loginUrl    = env('AUTHIFY_URL') . "/login?redirect={$redirectUrl}";

        if ($request->header('X-Inertia')) {
            return response()->json(['message' => 'Unauthenticated'], 409)
                ->header('X-Inertia-Location', $loginUrl);
        }

        return redirect($loginUrl);
    }
}