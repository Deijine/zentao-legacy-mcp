# 部署框架自带的简单的blog示例 - zentaoPHP框架手册

zentaoPHP框架中自带了一个简单的blog示例，下面让我们来部署这个示例应用。如果安装的时候已经初始化了数据库，跳过这一步。 

#### 一、创建数据库
在db目录下面，有一个blog.sql。这是一个非常简单的表结构，使用phpmyadmin，或者是命令行的mysql工具，创建一个数据库，叫做blog，然后把这个sql文件里面的建表工具导入。 
$> mysql -u root -p
 $> create database blog;

![](https://static.zentao.net/web/data/upload/201105/2813161702599773.gif)

![](https://static.zentao.net/web/data/upload/201105/2813171704330d69.gif)

#### 二、创建应用的配置文件

### 
在我们的代码中，已经内置了一个config.php文件，可以直接修改这个配置文件，但是我们建议的方式是创建一个my.php，将当前应用相关的配置在这个my.php文件中重新定义。这样可以解决代码冲突的问题。 
将config/my.example.php文件，复制为my.php，然后修改其中的数据库访问参数。 

```
$config->debug = true;                    // 开发环境，可以将debug打开。
$config->requestType = 'PATH_INFO';       // 如果apache打开了mod_rewrite，可以用这个选项。如果不行，则改用GET
$config->requestFix = '-';                // 路径分隔符。
$config->webRoot = '/zentaophp/';         // 当前应用的web访问路径。
$config->db->port = '3306';
$config->db->name = 'blog';
$config->db->user = 'root';
$config->db->password = '';
```

#### 三、访问blog应用。
http://localhost/zentaophp/blog/，即可看到界面了。 

![](https://static.zentao.net/web/data/upload/201408/f_18cf1fc3be09d4544e615a613393645a.png)
