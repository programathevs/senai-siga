<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case INSTRUTOR = 'instrutor';
    case AQV = 'aqv';

    /**
     * Retorna os valores em array para uso em validações.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
