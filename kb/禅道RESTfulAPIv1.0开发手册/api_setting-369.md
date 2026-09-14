# 配置使用与常见问题

### 一、配置参数
禅道 PHP-SDK 在开源版 12.0.1 版本之后新增到禅道框架目录中，禅道 PHP-SDK 文件位于【禅道项目目录/sdk/php/】下。使用 SDK （zentao.php）文件之前，需要在引用的禅道 SDK 文件中填写一些必要配置信息。禅道安装部署的域名、禅道用户账户、禅道用户密码、禅道配置的参数请求方式。

```
const ztUrl        = 'http://zentao.*****.com';    // 禅道部署域名
const ztAccount    = 'admin';                      // 禅道登录账户
const ztPassword   = '123456';                     // 禅道登录密码
const ztAccessMode = 'PATH_INFO';                  // 禅道参数请求方式[ GET | PATH_INFO ]
```

###  二、禅道SDK可用API列表 
-  获取部门列表
-  批量添加部门 
-  获取用户列表 
-  添加单个用户可选信息 
-  添加单个用户 
-  获取产品列表 
-  添加单个产品可选信息 
-  添加单个产品 
-  获取项目列表 
-  添加单个项目可选信息 
-  添加单个项目 
-  获取任务列表 
-  添加单个任务可选信息 
-  添加单个任务 
-  完成单个任务可选信息 
-  完成单个任务 
-  获取Bug列表 
-  添加单个Bug可选信息 
-  添加单个Bug 
-  解决单个Bug可选信息 
-  解决单个Bug 

###  三、使用说明与示例 

####   3.1使用说明 
 在使用前，确保配置的相关信息填写无误，同时确保登录账户有足够的权限以及登录账户无需进行弱密码重置。所有请求的 API 结果都以 JSON 格式返回，可以根据请求结果中的 status 状态来判断是否请求成功，如果请求失败，部分 API 会给出相应的提示。在请求 API 的过程中，以 【获取部门列表】 举例，$params 包含了可传的请求参数，可以为空数组，传参中无需必填参数时可不传递此变量。$extraFields 自定义返回字段，可以根据所需字段结果，进行返回，可自定义字段不限于示例中的字段，此变量可以不传。 

####   3.2使用示例 
 以下将以 zentaoPHP 框架中引用作为示例，将 SDK 文件放置在框架目录 tools/zentao/ 下。其它主流框架，如 ThinkPHP、Laravel 等可根据实际需求放置框架目录中，存放目录尽量遵守框架规范。 

```
/**
 * 获取部门列表
 * 
 * @access public
 * @return void
 */
public function getDeptList()
{
    include_once('../../tools/zentao/zentao.php');
    $zentao      = new zentao();    // 实例化类,如果实例化错误,可修改为 "\new zentao();"
    $params      = array('deptID' => 1);    // 请求参数
    $extraFields = array('title', 'deptID', 'parentDepts', 'sons', 'tree');    // 自定义返回字段
    $result      = $zentao->getDeptList($params, $extraFields);    // 调用SDK方法
    echo $result;
}
```

###  四、常见问题？ 

####   4.1调用禅道 SDK 类中方法，出现错误提示 "Trying to get property of non-object" ? 
通常由以下情况造成，开发者可以打印输出 SDK 中请求结果 $result 查看返回信息以此查看原因。
-  第一种情况，需要修改密码。解决方案： 登录后台管理系统，找到 后台->安全->密码安全设置 关闭密码检查、关闭强制修改弱密码、关闭强制首次登录修改密码 

```
<html><meta charset='utf-8'/>
<style>body{background:white}</style>
<script>self.location='/index.php?m=my&f=changepassword&t=json';</script>
```

- 第二种情况，没有操作权限。解决方案： 登录后台管理系统，给该账号设置相关权限。

```
<html><meta charset='utf-8'/>
<style>body{background:white}</style>
<script>self.location='/index.php?m=user&f=deny&t=json&module=dept&method=browse';</script>
```

- 第三种情况，缺失参数。解决方案： 在 API 列表 中找到对应方法，检查所传参数是否与文档列表中的参数相符。

#### 4.2 调用禅道 SDK 类中方法，出现错误提示 "Fatal error: Uncaught Error: Call to undefined function curl_init() "?
 这个是由于当前 PHP 缺失了 curl 的扩展，安装这个 PHP 扩展即可恢复正常使用。
