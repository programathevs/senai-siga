<?php

namespace App\Http\Controllers\Api;

use App\Actions\CreateUserAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterUserRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class RegisterController extends Controller
{
    public function __invoke(RegisterUserRequest $request, CreateUserAction $createUser): JsonResponse
    {
        $user = $createUser->execute($request->validated());

        return (new UserResource($user))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
