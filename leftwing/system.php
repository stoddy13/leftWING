<?php
namespace leftWING;
require_once __DIR__ . "/system/environment.php";
function system(
    $command,
    $absoluteWebRoot,
    $customer,
    $applicationShortcut,
    $development){
    
    environment::instantiate(
        
        
        // =============================================
        // System Web Root
        // The relative path to $_SERVER["DOCUMENT_ROOT"]
        // Start and terminate with a '/'
        // ----------------------------------------------
        "/lw/",
        // =============================================
        
        
        // =============================================
        // mysql Server Connection Data
        // ----------------------------------------------
        "localhost",    // host
        "stephan",      // username
        "giro2002",     // password
        "leftwing",     // system database name
        // ==============================================


        $absoluteWebRoot,
        $customer,
        $applicationShortcut,
        $development
    )->execute($command);
    
    
}
?>