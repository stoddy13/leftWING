<?php
namespace leftWING;

require_once "input.php";
require_once "output.php";

$cookies = input::readHashFromFile("test.txt");
var_dump($cookies);
echo(input::parameter("username"));

?>