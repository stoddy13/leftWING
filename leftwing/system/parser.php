<?php

namespace leftWING;

require_once __DIR__ . "/validation.php";

final class parse
{
    private function __construct()
    {
    }
    public static function index($index)
    {
        if(!valid::index($index)){
            throw new \Exception(
                "Number '$index' isn't a valid index.");
        }
        return $index;
    }
    public static function id($id)
    {
        if(!valid::id($id)){
            throw new \Exception(
                "Number '$id' isn't a valid id.");
        }
        return $id;
    }
    public static function string($string)
    {
        if(!is_string($string)){
            throw new \Exception("isn't a valid string.");
        }
        return $string;
    }
    public static function stringLength($string, $min, $max)
    {
        $string = self::string($string);
        $n = strlen($string);
        if(($n < $min) || ($max < $n))
        throw new \Exception(
            "doesn't conform to: $min <= strlen <= $max");
        return $string;
    }
    public static function variableName($string){
        if(!valid::variableName($string)){
            throw new \Exception(
                "Argument '$string' isn't a valid variable name.");
        }
        return $string;
    }
    public static function instance($object, $className)
    {
        if((gettype($object) == "object") && (get_class($object) == $className || is_subclass_of($object, $className))){
            return $object;
        }
        throw new \Exception("Argument '\$object' isn't instance of class '$className' but " . get_class($object));
    }
    public static function assignment($assignment)
    {
        $parts = explode("=", $assignment);
        if((count($parts) < 2)){
            throw new \Exception(
                "'$assignment' doesn't match 'name=value' pattern. ");
        }
        $name = trim(array_shift($parts));
        if(!valid::variableName($name)){
            throw new \Exception(
                "Left part of assignment '$assignment' " .
                "must be a valid variable name.");
        }
        return array($name, trim(implode("=", $parts)));
    }
    
    
}

?>