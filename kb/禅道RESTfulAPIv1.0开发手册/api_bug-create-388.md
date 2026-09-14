# 添加单个Bug

|  方法说明 
请求此方法，用于新增 Bug 反馈，新增 Bug 时可以绑定所属产品、项目、优先级等相关信息，并指派给某个用户。
|  使用示例

```
public function addBug()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao = new \zentao();
    $params = array(
        'product'        => 1,
        'module'         => 2,
        'project'        => 1,
        'openedBuild'    => array('trunk', 3, 2),
        'assignedTo'     => 'lisi',
        'deadline'       => '2019-11-21',
        'type'           => 'codeerror',
        'os'             => 'windows',
        'browser'        => 'ie11',
        'title'          => '添加bug测试四',
        'color'          => '#2dbdb2',
        'severity'       => 2,
        'pri'            => 1,
        'steps'          => '重现步骤描述添加bug测试四',
        'story'          => 0,
        'task'           => 0,
        'mailto'         => array('lisi', '张三'),
        'keywords'       => 'bug4'
    );    // 请求参数
    $result = $zentao->addBug($params);
    return $result;
}
```

|  请求方式
 POST 
|  方法名称
 addBug

|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  product
 int  必填参数
 所属产品ID

|  module
 int
 选填参数
 所属模块ID

|  project
 int
 选填参数
 所属项目ID

|  openedBuild
 array  选填参数
 影响版本ID【添加单个 Bug 可选信息结果中 builds 记录的 key 值】

|  assignedTo
 string  选填参数
 当前指派【用户账号】

|  deadline
 string
 选填参数
 截止日期【格式示例：2019-11-11】

|  type
 string
 选填参数
 BUG类型【codeerror代码错误|config配置相关|install安装部署|security安全相关|performance性能问题|standard标准规范|automation测试脚本|designdefect设计缺陷|others其他】

|  os  string
 选填参数
 选填参数|操作系统【all-全部|windows-Windows|win10-Windows 10|win8-Windows 8|win7-Windows 7|vista-Windows Vista|winxp-Windows XP|win2012-Windows 2012|win2008-Windows 2008|win2003-Windows 2003|win2000-Windows 2000|android-Android|ios-IOS|wp8-WP8|wp7-WP7|symbian-Symbian|linux-Linux|freebsd-FreeBSD|osx-OS X|unix-Unix|others-其他】

|  browser
 string
 选填参数
 选填参数|浏览器【all-全部|ie-IE系列|ie11-IE11|ie10-IE10|ie9-IE9|ie8-IE8|ie7-IE7|ie6-IE6|chrome-Chrome|firefox-firefox系列|firefox4-firefox4|firefox3-firefox3|firefox2-firefox2|opera-opera系列|oprea11-oprea11|oprea10-opera10|opera9-opera9|safari-safari|maxthon-傲游|uc-UC|other-其他】

|  title
 string
 必填参数
 BUG标题

|  browser
 string
 选填参数
 BUG颜色【示例：#2dbdb2】

|  severity
 int
 选填参数
 严重程度【1~4】

|  pri
 int
 选填参数
 优先级【1~4】

|  steps
 string
 选填参数
 重现步骤描述

|  story
 int
 选填参数
 相关需求ID

|  task
 int
 选填参数
 相关任务ID

|  keywords
 string
 选填参数
 BUG关键词

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
        "title": [
            "『Bug标题』不能为空。"
        ]
    }
}
```
