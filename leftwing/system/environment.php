<?php

namespace leftWING;

require_once __DIR__ . "/parser.php";
require_once __DIR__ . "/request.php";
require_once __DIR__ . "/response.php";
require_once __DIR__ . "/mysql.php";
require_once __DIR__ . "/application.php";
require_once __DIR__ . "/cookie.php";
require_once __DIR__ . "/session.php";

class environment
{
    private static $instances = 0;

    protected static $request = null;
    private static $response = null;
    private static $webroot = "";
    private static $mysqlConnection = null;
    private static $database = null;
    private static $application = null;
    private static $session = null;
    
    public static function instantiate(
        $relativeSystemWebRoot,
        $host, $user, $pass, $dbname,
        $absoluteWebRoot,
        $customer,
        $application,
        $development = false)
    {
        self::$webroot = $relativeSystemWebRoot;
        self::$database = array($host, $user, $pass, $dbname);
        self::$application = array($absoluteWebRoot, $customer, $application);

        if(!is_bool($development)){
            die($method . "Argument 4 is not of type 'boolean'.");
        }
        return ($development ?
            new developmentEnvironment() :
            new productionEnvironment());
    }
    protected function __construct($errorHandler)
    {
        ini_set("error_reporting", E_ALL | E_STRICT);
        self::$request = new request();
        self::$response = new response($this);
        set_error_handler($errorHandler);
        
        if(self::$instances++ > 0){
            throw new \Exception("Class is a singleton.");
        }
        
        try{
            self::assureSystemWebroot();
            self::$mysqlConnection = new mysqlConnection(self::$database);
            self::$database = new mysqlDatabase(self::$mysqlConnection, self::$database[3]);
            self::$application = new \application(self::$database, self::$application);
            self::$session = new session($this, new cookie(self::$application->shortcut, "5geäÄ*'ds$/$2403nbd4-h"));
            self::$session->translate();
        }
        catch(\Exception $exception){
            trigger_error(
                __METHOD__ . ": " . $exception->getMessage(),
                E_USER_ERROR);
        }
    }
    public function __get($name)
    {
        switch($name){
            case "webroot": return self::$webroot;
            case "application": return self::$application;
            case "request": return self::$request;
            case "responseFormat": return self::$request->responseFormat();
            case "respond": return self::$response;
            case "database": return self::$database;
            case "session": return self::$session;
            default: trigger_error("Invalid property '$name'.");
        }
    }
    private static function assureSystemWebroot()
    {
        $docroot = $_SERVER["DOCUMENT_ROOT"];
        try{
            parse::stringLength(self::$webroot, 1, 255 - strlen($docroot));
        }
        catch(\Exception $exception){
            throw new \Exception(
                __METHOD__ . ": Argument '\$relativeSystemWebRoot': " .
                $exception->getMessage());
        }
        try{
            
            if(!preg_match('/^\/([^.\/\\\\]+\/)*$/', self::$webroot)){
                throw new \Exception(
                    "doesn't start and termintat with a '/' " .
                    "or contains at least one '.' or '\\'.");
            }
            $absoluteSystemWebRoot = $docroot . self::$webroot;
            if(!is_dir($absoluteSystemWebRoot)){
                throw new \Exception(
                    "expands to absolute path '$absoluteSystemWebRoot' " .
                    "pointing to a non-existing directory.");
            }
        }
        catch(\Exception $exception){
            throw new \Exception(
                __METHOD__ . ": Argument \$relativeSystemWebRoot" .
                $exception->getMessage());
        }
    }
    private static function getPath($root, $class){
        
        if(is_dir($root)){
            $entries = scandir($root);
            foreach($entries as $entry){
                if(is_file("$root/$entry") && $entry == "$class.php"){
                    return "$root/$entry";
                }
            }
            foreach($entries as $entry){
                if(!in_array($entry, array(".", "..")) && is_dir("$root/$entry")){
                    return self::getPath("$root/$entry", $class);
                }
            }
            return false;
        }
        else{
            throw new \Exception(__METHOD__ . ": Argument \$root '$root' isn't a directory.");
        }
    }
    private static function handleRequest()
    {
        try{
            $requestedMethod = self::$request->parameter("m");
            
            if($requestedMethod == null){
                self::$response->html();
            }
            else if(preg_match('/^([^:]{1,255}):([^:]{1,255})::([^:]{1,255})$/', $requestedMethod, $slices)){
                
                array_shift($slices);
                list($system, $class, $method) = $slices;
                
                if(!method_exists($class, $method)){
                    $systemDirectory = self::$database->recordAsValue(
                            "SELECT directory FROM systems " .
                            "WHERE label = '" . self::$database->escape($system) . "'");
                    if($systemDirectory == null){
                        throw new \Exception(
                            __METHOD__ . ": Couldn't retrieve directory " .
                            "of system '$system' from database.");
                    }
                    $systemDirectrory = preg_replace(
                                            '/leftWINGroot/',
                                            __DIR__ . DIRECTORY_SEPARATOR . "..",
                                            $systemDirectory);
                    
                    $classFile = self::getPath($systemDirectory, array_pop(explode("\\", $class)));
                    if(!is_file($classFile)){
                        throw new \Exception(
                            __METHOD__ . ": class file: '$classFile' doesn't exist");
                    }
                    require_once $classFile;
                    if(!method_exists($class, $method)){
                        throw new \Exception(
                            __METHOD__ . ": Static method: '$class::$method()' " .
                            "doesn't exist.");
                    }
                }
                $class::$method();
            }
            else{
                throw new \Exception(
                    __METHOD__ . ": Invalid request parameter m: '$requestedMethod'. " .
                    "It should match 'system:class:: method'. ");
            }
        }
        catch(\Exception $exception){
            trigger_error(__METHOD__ . ": " . $exception->getMessage(), E_USER_ERROR);
        }
    }

    protected function traceLines($code, $message, $file, $line)
    {
        $traceLines = array();
        
        if(isset($file)){
            $message .= " in '$file'";
            if(isset($line)){
                $message .= " (line $line)";
            }
        }
        array_push($traceLines, $message);
        
        $traces = debug_backtrace();
        foreach($traces as $trace){
            $line = "";
            if(isset($trace["file"])){
                $line = $trace["file"];
                if(isset($trace["line"])){
                    $line .= " (line " . $trace["line"] . ")";
                }
                array_push($traceLines, $line);
            }
        }
        return $traceLines;
    }
    private static function splitPhrase($phrase){
        
        $database = self::$database;
        $parts = explode("|", trim($phrase));
        $content = $category = $hint = "";
        switch(count($parts)){
            case 3:
                $parts[0] = trim($parts[0]);
                $parts[1] = trim($parts[1]);
                $parts[2] = trim($parts[2]);
                $content = "'" . $database->escape($parts[0]) . "'";
                $category = "'" . $database->escape($parts[1]) . "'";
                $hint = "'" . $database->escape($parts[2]) . "'";
                $original = $parts[0];
                break;
            case 2:
                $parts[0] = trim($parts[0]);
                $parts[1] = trim($parts[1]);
                $content = "'" . $database->escape($parts[0]) . "'";
                $category = "'" . $database->escape($parts[1]) . "'";
                $hint = "NULL";
                $original = $parts[0];
                break;
            default:
                throw new \Exception(" '$phrase' doesn't match phrase|category[|hint]");
        }
        return array($content, $category, $hint, $original);
    }
    private static function parsePhrases($phrases)
    {
        $database = self::$database;
        if(is_string($phrases)){
            $phrases = array($phrases);
        }
        if(!is_array($phrases)){
            throw new \Exception(__METHOD__ . "Argument \$phrases is neither a string nor an array.");
        }
        $splittedPhrases = array();
        $i = 0;
        try{
            for(; $i < count($phrases); $i++){
                array_push($splittedPhrases, self::splitPhrase($phrases[$i]));
            }
        }
        catch(\Exception $exception){
            throw new \Exception("Argument " . ($i + 1) . " " . $exception->getMessage());
        }
        return $splittedPhrases;
    }
    public static function translate($phrases)
    {
        try{
            $phrases = self::parsePhrases($phrases);
            $database = self::$database;
            $database->execute("LOCK TABLE phrasecategories WRITE, phrases WRITE, languages READ, translations READ");
            
            $translations = array();
            foreach($phrases as $phrase){
                list($content, $category, $hint, $original) = $phrase;
                $categoryId = $database->recordAsValue(
                    "SELECT id FROM phrasecategories WHERE label = $category");
                if($categoryId == null){
                    $database->execute(
                        "INSERT INTO phrasecategories (label) VALUES ($category)");
                    $categoryId = $database->recordAsValue("SELECT MAX(id) FROM phrasecategories");
                }
                $phraseId = $database->recordAsValue(
                    "SELECT id FROM phrases " .
                    "WHERE category = $categoryId AND " .
                          "content = $content AND " .
                          "hint " . ($hint == "NULL" ? "IS" : "=") . " $hint");
                if($phraseId == null){
                    $database->execute(
                        "INSERT INTO phrases (category, content, hint) " .
                        "VALUES($categoryId, $content, $hint)");
                    array_push($translations, $original);
                }
                else{
                    $translation = $database->recordAsValue(
                        "SELECT content FROM translations " .
                        "WHERE phrase = $phraseId AND language = " . self::$session->language["id"]);
                    if($translation != null){
                        array_push($translations, $translation);
                    }
                    else{
                        array_push($translations, $original);
                    }
                }
            }
            $database->execute("UNLOCK TABLES");
            return $translations;
        }
        catch(\Exception $exception){
            trigger_error(__METHOD__ . ": " . $exception->getMessage());
        }
        
    }
    private static function compareLanguages($a, $b)
    {
        if($a["label"] == $b["label"]){
            return 0;
        }
        return($a["label"] < $b["label"] ? -1 : 1);
        
    }
    public static function data()
    {
        $phrases = self::$request->parameter("phrases");
        $availableLanguages = self::$database->recordsetAsArrayOfHashes(
            "SELECT id, label FROM languages WHERE available");
        for($i = 0; $i < count($availableLanguages); $i++){
            $translations = self::translate($availableLanguages[$i]["label"] . "|language label");
            $availableLanguages[$i]["label"] = $translations[0];
        }
        
        usort($availableLanguages, array("self", "compareLanguages"));
        self::$response->ajax("data", array(
            "application" => self::$application->hash,
            "session" => array(
                "language" => self::$session->language,
                "user" => self::$session->user["name"]),
            "availableLanguages" => $availableLanguages,
            "translations" => self::translate($phrases)
        ));
    }
    public static function changeLanguage()
    {
        try{
            self::$session->changeLanguage();
            self::$response->ajaxNoError();
        }
        catch(\Exception $exception){
            self::$response->ajaxError(10, __METHOD__ . ": " . $exception->getMessage());
        }
    }
    public static function login()
    {
        try{
            self::$session->login();
            self::$response->ajaxNoError();
        }
        catch(\Exception $exception){
            self::$response->ajaxError(20, $exception->getMessage());
        }
    }
    public static function logout()
    {
        try{
            self::$session->logout();
            self::$response->ajaxNoError();
        }
        catch(\Exception $exception){
            self::$response->ajaxError(20, $exception->getMessage());
        }
    }
    public static function changePassword()
    {
        try{
            self::$session->changePassword();
            self::$response->ajaxError(30, self::translate("Your password was successfully changed|user info")[0]);
        }
        catch(\Exception $exception){
            self::$response->ajaxError(20, $exception->getMessage());
        }
    }
    public function javascript(){
        
        $file = self::$application->directory;
        
        if(self::$session->loggedInApplication()){
             $file .= "/js/" . self::$application["shortcut"] . ".js";
            if(!is_file($file)){
                trigger_error(__METHOD__ . ": File '$file' not found.", E_USER_ERROR);
            }
            else{
                readfile($file);
                exit(0);
            }
        }
        else{
            $file .= "/js/login.js";
            if(!is_file($file)){
                $systemFile = __DIR__ . "/js/login.js";
                if(!is_file($systemFile)){
                    trigger_error(__METHOD__ . ": Neither file '$file' " .
                                  "nor '$systemFile' found.", E_USER_ERROR);
                }
                else{
                    readfile($systemFile);
                    exit(0);
                }
            }
            else{
                readfile($file);
                exit(0);
            }
            
        }
        
    }
    public function execute($command){
        
        $execute = array(
            "handleRequest" => "handleRequest",
            "sendCode" => "javascript"
        );
        if(is_string($command)){
            if(in_array($command, array_keys($execute))){
                $this->$execute[$command]();
            }
            else{
                trigger_error(
                    "Argument \$command: '$command' " .
                    "not supported.", E_USER_ERROR);
            }
        }
        else{
            trigger_error(
                "Argument '\$command' isn't of type 'string'.",
                E_USER_ERROR);
        }        
        
    }
}
final class developmentEnvironment extends environment
{
    public function __construct()
    {
         parent::__construct(array($this, "onError"));
        ini_set("log_errors", "Off");
    }
    public function onError($code, $message, $file, $line)
    {
        $this->respond->error(10, $this->traceLines($code, $message, $file, $line));
    }
}
final class productionEnvironment extends environment
{
    public function __construct()
    {
        $logfile = __DIR__ . DIRECTORY_SEPARATOR . "error.log";
        if(!touch($logfile)){
            trigger_error("Couldn't touch file '$logfile'.", E_USER_ERROR);
        }
        ini_set("log_errors", "On");
        ini_set("error_log", $logfile);
        parent::__construct(array($this, "onError"));
    }
    public function onError($code, $message, $file, $line)
    {
        error_log(
            $this->application["customer"] . "[" .
            $this->application["shortcut"] . "]: " .
            "$message in '$file' (line $line)");
        $this->respond->error(10, "Service currently not available.");
    }
}





?>