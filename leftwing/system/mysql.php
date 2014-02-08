<?php

namespace leftWING;

final class mysqlConnection{
    
    private $resource = null;
    
    public function __construct($info)
    {
        if(!is_array($info)){
            throw new \Exception(__METHOD__ . ": Argument \$info isn't of type array.");
        }
        if(!($this->resource = mysql_connect($info[0], $info[1], $info[2]))){
            throw new \Exception(mysql_error());
        }
    }
    public function __get($name)
    {
        if($name != "resource")
            throw new \Exception("Property '$name' not available.");
        return $this->resource;
    }
    
}
final class mysqlDatabase{

    private $connection = null;
    private $name;
     
    public function __construct($connection, $name)
    {
        $this->connection = $connection->resource;
        $this->name = $name;
        $this->select();
    }
    public function throwException($message)
    {
        $this->execute("UNLOCK TABLES");
        throw new \Exception($message);
    }
    
    private function select()
    {
        if(!mysql_selectdb($this->name, $this->connection))
            throw new \Exception(mysql_error());
    }
    
    public function escape($string)
    {
        return mysql_real_escape_string($string);
    }
    
    public function getFieldnames($table)
    {
        $this->select();
        $recordset = mysql_query("SELECT * FROM $table LIMIT 1");
        if(!$recordset){
            throw new \Exception(mysql_error());
        }
        $fieldnames = array();
        for($i = 0; $i < mysql_numfields($recordset); $i ++)
            array_push($fieldnames, mysql_field_name($recordset, $i));
        return $fieldnames;
    }
    public function execute($sql){
        
        $this->select();
        if(!(mysql_query($sql, $this->connection)))
            throw new \Exception(mysql_error());
    }
    private function query($sql){
        
        $this->select();
        if(!($rs = mysql_query($sql, $this->connection)))
            throw new \Exception(mysql_error());
        return $rs;
    }
    
    public function existsRecord($sql){
    
        $recordset = $this->query($sql);
        return (mysql_fetch_row($recordset) ? true : false);
    }

    public function recordAsValue($sql)
    {
        return (($r = $this->recordAsArray($sql)) ? $r[0] : null);     
    }
    
    public function recordAsArray($sql)
    {
        return mysql_fetch_row($this->query($sql));     
    }
    
    public function recordAsHash($sql)
    {
        return mysql_fetch_assoc($this->query($sql));     
    }
    
    public function recordsetAsArrayOfArrays($sql){
    
        $records = array();
        $recordset = $this->query($sql);
        while($record = mysql_fetch_row($recordset))
            array_push($records, $record);
        return $records;
    }
    
    public function recordsetAsArrayOfHashes($sql){
    
        $records = array();
        $recordset = $this->query($sql);
        while($record = mysql_fetch_assoc($recordset))
            array_push($records, $record);
        return $records;
    }
    
    public function firstColumnAsArray($sql){
    
        $values = array();
        $recordset = $this->query($sql);
        while($record = mysql_fetch_row($recordset))
            array_push($values, $record[0]);
        return $values;
    }
}

?>