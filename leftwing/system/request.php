<?php

namespace leftWING;

require_once __DIR__ . "/parser.php";

final class request
{
    private static $parameters = array();
    private static $responseFormat = "";
    
    public function __construct()
    {
        if($this->fromCommandLine()){
            global $argv;
            $arguments = $argv;
            array_shift($arguments);
            foreach($arguments as $argument){
                try{
                    list($key, $value) = parse::assignment($argument);
                    self::$parameters[$key] = $value;
                }
                catch(\Exception $exception){
                    die(
                        "Commandline parameter '$argument': " .
                        $exception->getMessage());
                }
            }
        }
        else{
            self::$parameters = array_merge($_POST, $_GET);
        }
        
        if(isset(self::$parameters["t"])){
            switch(self::$parameters["t"]){
                case "a":
                    self::$responseFormat = "ajax"; break;
                case "h":
                    self::$responseFormat = "html"; break;
                default:
                    self::$responseFormat = (php_sapi_name() == "cli" ? "text" : "html");
            }
        }
        else{
            self::$responseFormat = (php_sapi_name() == "cli" ? "text" : "html");
        }
        return $this;
    }
    public function fromCommandline()
    {
        return (php_sapi_name() == "cli");
    }
    public function parameter($name, $default = null)
    {
        return (isset(self::$parameters[$name]) ?
                self::$parameters[$name] :
                $default);
    }
    public function responseFormat()
    {
        return self::$responseFormat;
    }
}


?>