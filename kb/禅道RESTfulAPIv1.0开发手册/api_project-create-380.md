# 添加单个项目

|  方法说明 
此方法用于新增一个新项目，添加新项目时可以指定相关负责人，设置产品类型和访问权限。
|  注意点  注意点一：假如 acl = custom ，可额外传递参数，例如：'whitelist' => array(1, 2) ，代表访问白名单中的权限分组 ID。
 注意点二：关联一个或者多个产品时额外传参字段，例如：'products' => array(4, 5)，代表同时关联产品 ID 等于 4 和 5 的产品。
 注意点三：关联一个或者多个计划时额外传参字段，例如： 'plans' => array(5, 6)，代表关联产品 ID 等于4 下的计划 ID 等于 5 的计划，关联产品 ID 等于5 下计划 ID 等于 6 的计划。
|  使用示例

```
public function addProject()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao = new \zentao();
    $params = array(
        'name'        => '禅道项目管理开发',
        'code'        => 'zentao',
        'begin'       => '2020-01-01',
        'end'         => '2020-06-06',
        'days'        => '100',
        'team'        => '禅道开发团队',
        'type'        => 'sprint',
        'status'      => 'wait',
        'products[0]' => 0,
        'plans[0]'    => 0,
        'desc'        => '禅道是专业的研发项目管理软件。',
        'acl'         => 'custom',
        'whitelist'   => array(1, 2),
        'products'    => array(4, 5),
        'plans'       => array(5, 6)
    );    // 请求参数
    $result = $zentao->addProject($params);
    return $result;
}
```

|  请求方式
 POST 
|  方法名称

addProject 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  name
 string  必填参数
 项目名称

|  code
 string
 必填参数
 项目代号

|  begin
 string
 必填参数
 起始日期【时间格式：2019-11-20】

|  end
 string
 必填参数
 结束日期【时间格式：2019-11-20】

|  days
 int
 选填参数
 可用工作日

|  team
 string
 选填参数
 团队名称

|  type
 string
 选填参数
 项目类型【sprint短期项目|waterfall长期项目|ops运维项目】

|  desc
 string
 选填参数
 项目描述

|  acl
 string
 选填参数
 访问控制【open默认设置|private私有项目|custom白名单】

|  whitelist  array  选填参数
 白名单中的权限分组 ID

|  products
 array
 选填参数
 关联产品 ID

|  plans
 array
 选填参数
 关联产品 ID 所属计划 ID

|  响应结果
 success  error 
|  

```
{
    "status": 1,
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
            "『项目名称』已经有『禅道项目开发』这条记录了。如果您确定该记录已删除，请到后台-数据-回收站还原。"
        ],
        "code": [
            "『项目代号』已经有『zentao』这条记录了。如果您确定该记录已删除，请到后台-数据-回收站还原。"
        ]
    }
}
```
