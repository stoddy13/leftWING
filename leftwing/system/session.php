<?php

namespace leftWING;

require_once __DIR__ . "/parser.php";

final class session
{
    private static $instances = 0;
    private static $environment = null;
    private static $properties = null;
    
    public function __construct($environment, $cookie)
    {
        if(self::$instances++ > 0){
            throw new \Exception("Class '" . __CLASS__ . "' is a singleton");
        }
        try{
            
            
            self::$environment = parse::instance($environment, "leftWING\\environment");
            $cookie = parse::instance($cookie, "leftWING\\cookie");
            $database = self::$environment->database;
            
            $database->execute("LOCK TABLE sessions WRITE, languages READ, users READ");
            
            $guestUser = array(
                "id" => 0,
                "name" => "guest",
                "privileges" => array()
            );
            $now = date("Y-m-d H:i:s");
            $properties = array();
            if(!($cookie->received && ($properties = $database->recordAsHash(
                "SELECT user, data, " .
                        "languages.id AS languageId, shortcut, label " .
                "FROM sessions INNER JOIN languages ON sessions.language = languages.id " .
                "WHERE sessions.id = " . $cookie->value))))
            {
                
                // No sessionId received or session data not retrievable
                // -----------------------------------------------------
                if(($language = $database->recordAsHash("SELECT id, shortcut, label FROM languages " .
                                                        "ORDER BY id LIMIT 1")) == null)
                {
                    $database->throwException(__METHOD__ . ": No language available in database.");
                }
                $database->execute("INSERT INTO sessions(language, user, lastrequest, data) " .
                                   "VALUES(" . $language["id"] . ", NULL, NOW(), '" .
                                   $database->escape(json_encode(array()))  . "')");
                $cookie->set($id = $database->recordAsValue("SELECT MAX(id) FROM sessions"));
                self::$properties = array(
                    "id" => $id,
                    "language" => array(
                        "id" => $language["id"],
                        "shortcut" => $language["shortcut"],
                        "label" => $language["label"]
                    ),
                    "user" => $guestUser,
                    "lastrequest" => $now,
                    "data" => array()
                );
                return;
            }
            
            // WE have got a seesionId and were able to retreive its data
            // ---------------------------------------------------------
            $database->execute("UPDATE sessions SET lastrequest = NOW() WHERE id = " . $cookie->value);
            self::$properties = array(
                "id" => $cookie->value,
                "language" => array(
                    "id" => $properties["languageId"],
                    "shortcut" => $properties["shortcut"],
                    "label" => $properties["label"]
                ),
                "user" => $guestUser,
                "lastrequest" => $now,
                "data" => json_decode($properties["data"])
            );
            if($properties["user"] != null){
                $user = $database->recordAsHash(
                    "SELECT users.uname AS name, users.data AS data, " .
                            "languages.id AS languageId, languages.shortcut AS languageShortcut, " .
                            "languages.label AS languageLabel " .
                    "FROM users INNER JOIN languages ON users.language = languages.id " .
                    "WHERE users.id = " . $properties["user"]);
                self::$properties["user"] = array(
                    "id" => $properties["user"],
                    "name" => $user["name"],
                    "privileges" => array());
                self::$properties["language"] = array(
                    "id" => $user["languageId"],
                    "shortcut" => $user["languageShortcut"],
                    "label" => $user["languageLabel"]);
                
            }
            $database->execute("UNLOCK TABLES");
        }
        catch(\Exception $exception){
            throw new \Exception(__METHOD__ . ": " . $exception->getMessage());
        }
    }
    public function __get($name)
    {
        if(!isset(self::$properties[$name])){
            throw new \Exception(__METHOD__ . ": Invalid property: '$name'.");
        }
        return self::$properties[$name];
    }
    public function translate()
    {
        // We cannot do the following during construction
        // since environment's tranlation service needs an instance of session
        self::$properties["language"]["label"] = environment::translate(
        self::$properties["language"]["label"] . "|language label")[0];
    }
    public function changeLanguage()
    {
        $languageId = parse::id(self::$environment->request->parameter("l"));
        $database = self::$environment->database;
        $database->execute("LOCK TABLE sessions WRITE, users WRITE, languages READ");
        if(!$database->existsRecord("SELECT id FROM languages WHERE id = $languageId")){
            throw new \Exeption("Language with id '$id' doesn't exist.");
        }
        $database->execute("UPDATE sessions SET language = $languageId " .
                           "WHERE id = " . self::$properties["id"]);
        $userId = self::$properties["user"]["id"];
        if($userId != 0){
            $database->execute("UPDATE users SET language = $languageId WHERE id = $userId");
        }
        $database->execute("UNLOCK TABLES");
    }
    public function login()
    {
        $environment = self::$environment;
        $request = $environment->request;
        $database = $environment->database;
        
        $incorrectLogin = $environment::translate(
            "Your account data could not be verified|user info")[0];
        
        try{
            $username = parse::stringLength($request->parameter('name'), 4, 50);
            $password = parse::stringLength($request->parameter('password'), 8, 80);
        }
        catch(\Exception $exception){
            throw new \Exception($incorrectLogin);
        }
        $user = null;
        try{
            $database->execute("LOCK TABLE sessions WRITE, users READ");
            $user = $database->recordAsHash(
                "SELECT id, language FROM users " .
                "WHERE uname = '" . $database->escape($username) . "' AND " .
                      "upass = MD5('" . $database->escape($password) . "')");
        }
        catch(\Exceptino $exception){
            trigger_error($exception->getMessage(), E_USER_ERROR);
        }
        if(!$user){
            throw new \Exception($incorrectLogin);
        }
        try{
            $database->execute("UPDATE sessions "  .
                               "SET user = " . $user["id"] . " " .
                               "WHERE id = " . self::$properties["id"]);
        }
        catch(\Exception $exception){
            trigger_error(__METHOD__ . ": " . $exception->getMessage(), E_USER_ERROR);
        }
    }
    public function logout()
    {
        self::$environment->database->execute("UPDATE sessions SET user = NULL " .
                                              "WHERE id = " . self::$properties["id"]);
    }
    public function changePassword()
    {
        $userId = self::$properties["user"]["id"];
        if($userId == 0){
            throw new \Exception($environment::translate(
                "You aren't logged in|user info")[0]);
        }
        
        $environment = self::$environment;
        $database = $environment->database;
        $pass = trim($environment->request->parameter("pass"));
        $repass = trim($environment->request->parameter("repass"));
        
        $n = strlen($pass);
        if($n < 8 || $n > 80){
            throw new \Exception($environment::translate(
                "The password is either to short or to long|user info")[0]);
        }
        if($pass != $repass){
            throw new \Exception($environment::translate(
                "The password isn't retyped correctly|user info")[0]);
        }
        try{
            $pass = $database->escape($pass);
            $database->execute("UPDATE users SET upass = MD5('$pass') WHERE id = $userId");
        }
        catch(\Exception $exception){
            trigger_error($exception->getMessage(), E_USER_ERROR);
        }
    }
    public function requires()
    {
        if($this->user["name"] == "root"){
            return;
        }
        $requiredPrivileges = func_get_args();
        foreach($requiredPrivileges as $requiredPrivilege){
            if(!in_array($requiredPrivilege, $this->user["privileges"])){
                self::$environment->response->error(20, "Privilege '$requiredPrivilege' missing.");
            }
        }
    }
    public function loggedInApplication(){
        if($this->user["name"] == "root"){
            return true;
        }
        else if($this->user["name"] == "guest"){
            return false;
        }
    }
}






?>