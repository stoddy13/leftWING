<?php

require_once __DIR__ . DIRECTORY_SEPARATOR . "environment.php";

final class customer
{
    private static $instances = 0;
    private static $customer = array();
    
    public function __construct($database, $shortcut){

        try{
            if(self::$instances++ > 0){
                throw new Exception("Class is a singleton.");
            }
            if(!(self::$customer = $database->recordAsHash(
                "SELECT id, shortcut, label " .
                "FROM customers " .
                "WHERE shortcut = '" . $database->escape($shortcut) . "'"))
            ){
                throw new Exception("Couldn't retrieve customer '$customer'.");
            }
        }
        catch(Exception $exception){
            throw new Exception(
                __METHOD__ . ": " . $exception->getMessage());
        }
    }
    public function __get($name){
        switch($name){
            case "id": return self::$customer["id"];
            case "shortcut": return self::$customer["shortcut"];
            case "label": return self::$customer["label"];
            case "hash": return self::$customer;
            default: throw new Exception(__METHOD__ . ": Invalid property '$name'.");
        }
    }
}
final class application
{
    private static $instances = 0;
    private static $customer = null;
    private static $webroot = "";
    private static $application = array();
    
    public function __construct($database, $arguments)
    {
        try{
            if(self::$instances++ > 0){
                throw new Exception("Class is a singleton.");
            }
            
            try{
                leftWING\parse::instance($database, "leftWING\\mysqlDatabase");
            }
            catch(\Exception $exception){
                throw new Exception("Argument 0 \$database: " . $exception->getMessage());
            }
            if(count($arguments) != 3){
                throw new Exception("Argument 1 \$arguments: invalid number of elements. We need 3 of them.");
            }
            $argumentNames = array("\$absoluteWebRoot", "\$customer", "\$application");
            
            for($i = 0; $i < count($arguments); $i++){
                $argumentName = $argumentNames[$i];
                $argument = $arguments[$i];
                try{
                    leftWING\parse::stringLength($argument, 1, 255);
                }
                catch(Exception $exception){
                    throw new Exception("Argument $argumentName: " . $exception->getMessage());
                }
                try{
                    switch($i){
                        
                        case 0:
                            if(preg_match('/\./', $argument)){
                                throw new \Exception("contains at least one '.'.");
                            }
                            if(!is_dir($argument)){
                                throw new \Exception("isn't a directory");
                            }
                            $slices = explode(DIRECTORY_SEPARATOR, $argument);
                            foreach(explode("/", $_SERVER["DOCUMENT_ROOT"]) as $slice){
                                array_shift($slices);
                            }
                            self::$webroot = implode("/", $slices);
                            break;
                        
                        case 1:
                            self::$customer = new customer($database, $argument);
                            break;
                        
                        case 2:
                            if(!(self::$application = $database->recordAsHash(
                                "SELECT id, shortcut, label, directory " .
                                "FROM applications " .
                                "WHERE customer = " . self::$customer->id . " AND " .
                                        "shortcut = '" . $database->escape($argument) . "'"))
                            ){
                                throw new Exception("Couldn't retrieve application '$application'.");
                            }
                            self::$application["directory"] = preg_replace('/leftWINGroot/',
                                    __DIR__ . DIRECTORY_SEPARATOR . ".." , self::$application["directory"]);
                            break;
                    }
                }
                catch(Exception $exception){
                    throw new Exception("Argument $i $argumentName: '$argument': " . $exception->getMessage());
                }
            }
        }
        catch(Exception $exception){
            throw new Exception(__METHOD__ . ": " . $exception->getMessage());
        }
    }
    public function __get($name){
        switch($name){
            case "customer": return self::$customer;
            case "webroot": return self::$webroot;
            case "id": return self::$application["id"];
            case "shortcut": return self::$application["shortcut"];
            case "label": return self::$application["label"];
            case "directory": return self::$application["directory"];
            case "hash":
                return array(
                    "id" => self::$application["id"],
                    "shortcut" => self::$application["shortcut"],
                    "label" => self::$application["label"],
                    "customer" => self::$customer->hash
                );
            return self::$application;
                            default: throw new Exception(__METHOD__ . ": Invalid property '$name'.");
        }
    }
    public static function sendData(){
        
    }
}


?>