<?php
namespace leftWING;

final class filesystem
{
   
    private function __construct()
    {
    }
    public static function getRelativeFilePaths($directories, $extension)
    {
        if(is_string($directories)){
            $directories = array($directories);
        }
        $requestedFiles = array();
        foreach($directories as $directory){
            if(is_dir($directory)){
                $files = scandir($directory);
                foreach($files as $file){
                    $path = "$directory/$file";
                    if(is_file($path) &&
                       preg_match('/\.' . $extension . '$/', $file)){
                        array_push($requestedFiles, $path);
                    }
                }
            }
        }
        return $requestedFiles;
    }
    public function readHashFromFile($filepath)
    {
        $hash = array();
        if(is_file($filepath)){
            $lines = file($filepath);
            if($lines === false){
                trigger_error(
                    "Function file($filepath) failed.",
                    E_USER_ERROR);
            }
            for($i = 0; $i < count($lines); $i++){
                try{
                    list($name, $value) = self::parseAssignment(trim($lines[$i]));
                    $hash[$name] = $value;
                }
                catch(\Exception $exception){
                    output::error(20,
                        "$filepath line " . ($i + 1) . ": " . $exception->getMessage());
                }
            }
        }
        return $hash;
    }
    public static function writeHashToFile($hash, $filepath)
    {
        $lines = array();
        foreach(array_keys($hash) as $key){
            array_push($lines, "$key=" . $hash[$key]);
        }
        if(file_put_contents($filepath, implode("\n", $lines)) === false){
            self::error(10, error::message(__FILE__, __LINE__,
                "Function file_put_contents($filepath, \$hash) failed."));
        }
        return count($lines);
    }
    public static function removeFile($filepath)
    {
        if(is_file($filepath)){
            if(!unlink($filepath)){
                self::error(10, error::message(__FILE__, __LINE__,
                    "Function unlink($filepath) failed."));
            }
        }
    }
}
?>