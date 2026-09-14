# 解决单个Bug

|  方法说明 
请求此方法，用于确认一个 Bug 已解决，同时为其绑定解决方案、解决版本、解决日期等相关信息。
|  注意点  注意点一：如果需要新增所属版本，需要额外添加三个参数，示例：'buildProject' => 1，'buildName' => '版本7.2.4', createBuild' => 1，分别代表选择哪个项目（ 项目ID ）、新增版本名称、确认创建。
 注意点二：如果解决方案是【 duplicate 重复 Bug 】 时，需要输入重复 Bug 的 ID,额外添加参数，示例：'duplicateBug' => 5，代表与 ID 等于 5 的 Bug 重复。

|  使用示例

```
public function addBugResolve()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao = new \zentao();
    $params = array(
        'bugID'         => 9,
        'resolution'    => 'duplicate',
        'resolvedBuild' => '2',
        'resolvedDate'  => '2019-11-22',
        'assignedTo'    => 'lisi',
        'comment'       => '解决bug描述',
        'buildProject'  => 1,
        'buildName'     => '版本7.2.5',
        'createBuild'   => 1,
        'duplicateBug'  => 2
    );    // 请求参数
    $result = $zentao->addBugResolve($params);
    return $result;
}
```

|  请求方式
 POST 
|  方法名称

addBugResolve 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  bugID
 int  必填参数 Bug ID 
|  resolution
 string
 必填参数
 解决方案【bydesign设计如此|duplicate重复Bug|external外部原因|fixed已解决|notrepro无法重现|postponed延期处理|willnotfix不予解决】

|  resolvedBuild
 string
 选填参数
 解决版本【如需新增版本，参考注意点一】

|  resolvedDate
 string
 选填参数
 解决日期【格式：2019-11-11】

|  assignedTo
 string
 选填参数
 指派用户【用户账号】

|  comment
 string
 选填参数
 备注描述

|  buildProject  int  选填参数
 新增版本所属项目ID 
|  buildName  string  选填参数
 新增版本名称

|  
createBuild  int
 选填参数
 是否创建【1是0否】 
|  
duplicateBug  int
 选填参数
 重复Bug的ID
|  响应结果
 success  error 
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

###
