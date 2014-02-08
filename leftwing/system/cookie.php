<?php

namespace leftWING;

require_once __DIR__ . "/parser.php";

final class cookie
{
    private $secret = null;
    private $properties = null;
    
    public function __construct($name, $secret)
    {
        $this->secret = parse::string($secret);
        $this->properties = array(
            "name" => parse::string($name),
            "value" => null
        );
        if($this->properties["received"] = isset($_COOKIE[$name])){
            $content = $_COOKIE[$name];
            $contentParts = explode("_", $content);
            if((count($contentParts) != 2) ||
               (MD5($contentParts[0] . $this->secret) != $contentParts[1])){
                throw new \Exception(__METHOD__ . ": Cookie intrusion detected.");
            }
            $this->properties["value"] = $contentParts[0];
        }
    }
    public function __get($name)
    {
        if(!isset($this->properties[$name])){
            throw new \Exception(__METHOD__ . ": Invalid property '$name'.");
        }
        return $this->properties[$name];
    }
     public function set($value)
    {
        $this->properties["value"] = $value;
        setcookie($this->name, $value . "_" . MD5($value . $this->secret));
    }
    public function reset()
    {
        $this->properties["value"] = "";
        setcookie($this->name, "", time() - 3600);
    }
}
?>