<?php

namespace leftWING;

require_once __DIR__ . "/request.php";
require_once __DIR__ . "/filesystem.php";

final class response
{
    private static $environment = null;

    // Data structures for recursive
    // file including
    private static $absoluteApplicationRoot = array();
    private static $extensions = array();
    private static $extensionPattern = "";
    private static $includeFiles = array();
    
    public function __construct($environment)
    {
        self::$environment = $environment;
    }
    private static function ajaxErrorHash($code, $message)
    {
        try{
            $number = parse::index($code);
            $message = parse::string($message);
        }
        catch(\Exception $exception){
            die(json_encode(array(
                "error" => array(
                    "code" => 10,
                    "message" => $exception->getMessage(), E_USER_ERROR))));
        }
        return array("code" => $code, "message" => $message);
    }
    public function ajaxNoError()
    {
        die(json_encode(array(
            "error" => self::ajaxErrorHash(0, "OK"))));
    }
    public function ajaxError($code, $message)
    {
        die(json_encode(array(
            "error" => self::ajaxErrorHash($code, $message))));
    }
    public function ajax($name, $content)
    {
        try{
            $name = parse::variableName($name);
        }
        catch(\Exception $exception){
            self::ajaxError(10, $exception->getMessage());
        }
        die(json_encode(array(
            "error" => self::ajaxErrorHash(0, "OK"),
            "$name" => $content)));
    }
    private function replace($replacements, $content)
    {
        foreach(array_keys($replacements) as $key){
            $content = preg_replace('/\[\[' . $key . '\]\]/', $replacements[$key], $content);
        }
        return $content;
    }
    public function htmlError($message)
    {
        $application = self::$environment->application;
        $replacements = array(
            "CUSTOMERSHORTCUT" => (is_object($application) ? $application->customer->shortcut : "unknown"),
            "APPLICATIONSHORTCUT" => (is_object($application) ? $application->shortcut : "unknown"),
            "MESSAGE" => $message);
        $file = file_get_contents(__DIR__ . "/html/error.html");
        die($this->replace($replacements, $file));
    }
    public function html()
    {
        self::$extensions = array("css", "js", "php");
        self::includeTree();

        $cssfiles = self::$includeFiles["css"];
        $jsfiles = array_merge(self::$includeFiles["js"], self::$includeFiles["php"]);
        
                
        $cssfiles = (count($cssfiles) == 0 ? "" : "\n\t\t<link href=\"" .
            implode("\" type=\"text/css\" rel=\"stylesheet\" />\n\t\t<link href=\"", $cssfiles) .
            "\" type=\"text/css\" rel=\"stylesheet\" />");
        $jsfiles = (count($jsfiles) == 0 ? "" : "\n\t\t<script src=\"" .
            implode("\" type=\"text/javascript\"></script>\n\t\t<script src=\"", $jsfiles).
            "\" type=\"text/javascript\"></script>");
        
        $application = self::$environment->application;
        $replacements = array(
            "CUSTOMERSHORTCUT" => (is_object($application) ? $application->customer->shortcut : "unknown"),
            "APPLICATIONSHORTCUT" => (is_object($application) ? $application->shortcut : "unknown"),
            "SCRIPTS" => $jsfiles,
            "LINKS" => $cssfiles);
        $file = file_get_contents(__DIR__ . "/html/index.html");
        die($this->replace($replacements, $file));
    }
    public function error($code, $lines)
    {
        if(!is_array($lines)){
            $lines = array($lines);
        }
        switch(self::$environment->request->responseFormat()){
            case "ajax": $this->ajaxError($code, implode("\n", $lines));
            case "html": $this->htmlError("\t\t\t" . implode("<br />\n\t\t\t", $lines));
            default: die(implode("\n", $lines));
        }
    }
    
    
    private static function includeTree(){
        
        // Initializing data structures for recursion
        // ------------------------------------------
        self::$includeFiles = array();
        self::$extensionPattern = "/\.(" . implode("|", self::$extensions) . ")$/";
        foreach(self::$extensions as $extension){
            self::$includeFiles[$extension] = array();
        }
        
        // Parsing
        // absolute application root
        // relative request path
        // -------------------------------
        self::$absoluteApplicationRoot = array();
        if(self::$environment->application->webroot != ""){
            self::$absoluteApplicationRoot = explode("/", self::$environment->application->webroot);
        }
        $relativeRequestPath = explode("/", $_SERVER["PHP_SELF"]);
        array_shift($relativeRequestPath);
        array_pop($relativeRequestPath);
        foreach(self::$absoluteApplicationRoot as $dummy){
            array_shift($relativeRequestPath);
        }
        self::$absoluteApplicationRoot = array_merge(
            explode("/", $_SERVER["DOCUMENT_ROOT"]),
            self::$absoluteApplicationRoot);
        
        $lwIncludeFiles = array(
            "css" => array(),
            "js" => array(
                "base.js",
                "code.js"
            )
        );
        foreach(array_keys($lwIncludeFiles) as $extension){
            foreach($lwIncludeFiles[$extension] as $file){
                $path = $_SERVER["DOCUMENT_ROOT"] . self::$environment->webroot . "$extension/$file";
                if(!is_file($path)){
                    throw new \Exception("File '$path' not found.");
                }
                array_push(self::$includeFiles[$extension], self::$environment->webroot . "$extension/$file");
            }
        }
        
        $n = count($relativeRequestPath);
        $actualPath = self::$absoluteApplicationRoot;
        for($i = 0, $depth = $n; $i < $n; $i++, $depth--){
            foreach(self::$extensions as $extension){
                self::includeBranch(array_merge($actualPath, array($extension)), $i, $depth);
            }
            $actualPath = array_merge($actualPath, array($relativeRequestPath[$i]));
        }
        foreach(self::$extensions as $extension){
            self::includeBranch(array_merge($actualPath, array($extension)), $i, $depth);
        }
        self::includeDirectory($actualPath, $i, $depth);
    }
    private static function includeDirectory($root, $toRemove, $toAdd){
        
        $rootPath = implode("/", $root);
        for($i = 0; $i < count(self::$absoluteApplicationRoot) + $toRemove; $i++){
            array_shift($root);
        }
        for($i = 0; $i < $toAdd; $i++){
            array_unshift($root, "..");
        }
        $includePath = implode("/", $root);
        if($includePath){
            $includePath .= "/";
        }
        
        if(is_dir($rootPath)){
            $entries = scandir($rootPath);
            foreach($entries as $entry){
                if($entry != "index.php"){
                    if(is_file("$rootPath/$entry") && preg_match(self::$extensionPattern, $entry, $matches)){
                        array_push(self::$includeFiles[$matches[1]], "$includePath$entry");
                    }
                }
            }
        }
        else{
            trigger_error(__METHOD__ . ": Argument '$root' isn't a directory.", E_USER_ERROR);
        }
    }
    private static function includeBranch($root, $toRemove, $toAdd){

        $rootPath = implode("/", $root);
        if(is_dir($rootPath)){
            $entries = scandir($rootPath);
            foreach($entries as $entry){
                if(!in_array($entry, array(".", ".."))){
                    self::includeBranch(array_merge($root, array($entry)), $toRemove, $toAdd);
                }
            }
            self::includeDirectory($root, $toRemove, $toAdd);
        }
    }
}











?>