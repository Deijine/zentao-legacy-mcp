# 添加单个产品

|  方法说明 
请求此方法，可以新增一个新产品，添加新产品时可以指定相关负责人，设置产品类型和访问权限。注意：假如参数 acl = custom ,可以额外传递参数,例如：'whitelist' => array(1, 2),添加白名单为权限分组列表中 ID。
|  使用示例  

```
public function addProduct()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao = new \zentao();
    $params = array(
        'name'         => 'product-200',
        'code'         => 'p200',
        'line'         => 0,
        'PO'           => 'lisi',
        'QD'           => 'zhangsan',
        'RD'           => 'wangwu',
        'type'         => 'normal',
        'status'       => 'normal',
        'desc'         => 'product description,product description',
        'acl'          => 'custom',
        'whitelist'    => array(1, 2)
    );    // 请求参数
    $result = $zentao->addProduct($params);
    return $result;
}
```

|  请求方式  POST 
|  方法名称  
addProduct 
|  请求参数  
|  参数名称  参数类型  是否必填  参数描述 
|  name
 string  必填参数 产品名称

|  code
 string  必填参数 产品代号

|  line
 int  选填参数  产品线ID

|  PO
 string  选填参数  产品负责人账号

|  QD
 string  选填参数  测试负责人账号

|  RD
 string  选填参数  发布负责人账号

|  type
 string  选填参数  产品类型【normal正常|branch多分支|platform多平台】

|  desc  string  选填参数  产品描述

|  acl
 string  选填参数  访问控制【open默认|private私有|custom白名单】

|  whitelist  array  选填参数  白名单，权限分组列表中 ID
|  响应结果
 success  error 
|  

```
{  "status": 1,
    "msg": "success",
    "result": "保存成功"
}
```

```
{
    "status": 0,
    "msg": "error",
    "result": {
        "name": [
            "『产品名称』不能为空。"
        ]
    }
}
```
