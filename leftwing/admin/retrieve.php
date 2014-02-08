<?php

final class retrieve
{

    public function customers($environment){
        
        $environment->session->requires("retrieve customers");
        
        $environment->respond->ajax(
            "customers",
            $environment->database->recordAsArrayOfHashes(
                "SELECT id, label, comment FROM customers ORDER BY label"
            )
        );
    }

?>