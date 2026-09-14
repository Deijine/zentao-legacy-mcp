# 批量添加部门

|  方法说明

请求此方法，可以批量添加部门。
|  使用示例  

```
public function addDept()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao = new \zentao();
    $params = array(
        'parentDeptID' => '1',
        'depts'        => array('Department D', 'Department F')
    );    // 请求参数
    $result = $zentao->addDept($params);
    return $result;
}
```

|  请求方式
 POST 
|  方法名称  addDept 
|  请求参数  
|  参数名称  参数类型  是否必填  参数描述 
|  
parentDeptID  int  
选填参数  
所属上级部门ID 
|  
depts  
array  必填参数 
新增部门名称，示例：'depts' => array('Department D', 'Department F')
|  响应结果  success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": []
}
```

```
{
    "status": 0,
    "msg": "error",
    "result": []
}
```
