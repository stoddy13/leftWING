<?php

namespace lw;

final class loginForm
{
    private static $title = "lw Login";
    private static $heading = "lw Login";
    public static $username = null;
    public static $password = null;
    
    private function __construct()
    {
    }
    
    public static function initialize($title, $heading)
    {
        self::$title = $title;
        self::$heading = $heading;
    }
    public static function send($message = "")
    {
        $heading = self::$heading;
        $html =<<<EOFORM
<form method="post">
    <fieldset>
        <legend>$heading</legend>
        <input type="hidden" name="r" value="login" />
        <table>
            <tr><td>Username:</td><td><input name="username" /></td></tr>
            <tr><td>Password:</td><td><input type="password" name="password" /></td></tr>
            <tr><td colspan="2"><input type="submit" value="Login"/> $message</td></tr>
        </table>
    </fieldset>
</form>
<script type="text/javascript">document.forms[0].username.focus();</script>
EOFORM;
        output::html(self::$title, $html);   
    }
    public static function received()
    {
        if(input::parameter("r") == "login"){
            $username = input::parameter("username");
            $password = input::parameter("password");
            if(($username != null) && ($password != null)){
                self::$username = $username;
                self::$password = $password;
                return true;
            }
            self::send("Incorrect Login");
        }
    }
    
}

?>