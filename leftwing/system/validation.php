<?php

namespace leftWING;

final class valid
{
    private function __construct()
    {
    }
    public static function variableName($string)
    {
        return (is_string($string) &&
                preg_match('/^[a-zA-Z_][a-zA-Z_0-9]{0,254}$/', $string));
    }
    public static function index($index)
    {
        return (($index == 0) || self::id($index));
        
    }
    public static function id($id)
    {
        return (is_integer($id + 0) && (0 < $id) && ($id <= PHP_INT_MAX));
    }
}
?>