<?php
require_once ($_SERVER["DOCUMENT_ROOT"] . "/../leftwing.php");
leftWING\system("sendCode", __DIR__, "leftWING", "admin", true);
?>