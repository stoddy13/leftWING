<?php

namespace leftWING;

class responder
{
    private static $environment;
    
    public function __construct($environment)
    {
        self::$environment = $environment;
        $format = $environment->responseFormat;
        switch($format){
            case "html":
                $environment->respond->html(get_class($this));
        }
        
    }
}

?>