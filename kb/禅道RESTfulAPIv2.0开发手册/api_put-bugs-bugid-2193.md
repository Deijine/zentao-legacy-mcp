# 修改Bug

PUT/bugs/:bugID

##  修改Bug 

### 请求URL
https://xxx.com/api.php/v2/bugs/:bugID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  title  string  否  Bug标题 
|  severity  int  否  严重程度，默认是3 
|  pri  int  否  优先级，默认是3 
|  type  string  否  Bug类型(codeerror 代码错误 | config 配置相关 | install 安装部署 | security 安全相关 | performance 性能问题 | standard 标准规范 | automation 测试脚本 | designdefect 设计缺陷 | others 其他) 
|  openedBuild  array  否  影响版本,主干是trunk，其他版本使用版本ID 
|  steps  string  否  重现步骤 
|  project  int  否  所属项目 
|  execution  int  否  所属执行 
|  story  int  否  相关需求

### 请求示例

```
{
    "title": "光敏元件显示错误",
    "severity": 3,
    "pri": 3,
    "type": "codeerror",
    "openedBuild": [
        "trunk"
    ],
    "steps": "[步骤] [结果] [期望]",
    "project": 2,
    "execution": 3,
    "story": 0
}
```

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败)

### 响应示例

```
{
    "status": "success"
}
```
