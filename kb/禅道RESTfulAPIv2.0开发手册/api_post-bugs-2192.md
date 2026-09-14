# 创建Bug

POST/bugs

##  创建Bug 

### 请求URL
https://xxx.com/api.php/v2/bugs

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  productID  int  是  所属产品 
|  title  string  是  Bug标题 
|  openedBuild  array  是  影响版本,主干是trunk，其他版本使用版本ID 
|  project  int  否  所属项目 
|  execution  int  否  所属执行 
|  severity  int  否  严重程度，默认是3 
|  pri  int  否  优先级，默认是3 
|  type  string  否  Bug类型(codeerror 代码错误 | config 配置相关 | install 安装部署 | security 安全相关 | performance 性能问题 | standard 标准规范 | automation 测试脚本 | designdefect 设计缺陷 | others 其他) 
|  steps  string  否  重现步骤 
|  story  int  否  相关需求

### 请求示例

```
{
    "productID": 1,
    "title": "压敏元件显示错误",
    "openedBuild": [
        "trunk"
    ],
    "project": 2,
    "execution": 3,
    "severity": 3,
    "pri": 3,
    "type": "codeerror",
    "steps": "[步骤] [结果] [期望]",
    "story": 0
}
```

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  id  int  ID

### 响应示例

```
{
    "status": "success",
    "id": 1
}
```
