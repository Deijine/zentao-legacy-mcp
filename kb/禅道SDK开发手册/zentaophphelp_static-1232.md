# 框架里面提供的html, js和css类 - zentaoPHP框架手册

禅道框架里面提供了一个front.class.php，里面内置了三个类，分别为html, js和css，用来生成一些html标签，创建简单的js交互。 

#### 一、html类
- html::title($title)  生成$title标签。 
- html::meta($name, $value) 生成html的meta标签。 
- html::icon($url) 生成icon文件的调用代码。 
- html::rss($url, $title) 输出rss。 
- html::a($href, $title, $target, $misc)，生成超链接。 
- html::mailto($mailto, $title) 生成mailto 链接。 
- html::select($name, $options, $selected, $attr)，生成标签。 
- html::radio($name, $options, $selected, $attr), 生成单选按钮。 
- html::checkbox($name, $options, $selected, $attr)，生成复选按钮。 
- html::input($name, $value, $attr) 生成文本框。 
- html::hidden($name, $value, $attr)生成隐藏变量。 
- html::password($name, $value, $attr)生成密码框。 
- html::textarea($name, $value, $attr)生成textarea 
- html::file($name, $attr)生成文件选择框。 
- html::submitButton($label, $attr) 生成提交按钮。 
- html::resetButton()，生成重置按钮。 
- html::commonButton($label, $attr) 生成一个普通的按钮。 
- html::linkButton($label, $link, $attr)，生成一个带有链接的按钮。

#### 二、JS类
- js::import($url, $version) 生成一个js文件的调用。version用来区分不同的版本，以避免客户端js文件不刷新的问题。 
- js::alert($message)，生成一个警告框 
- js::error($errors)，错误警告，$errors可以是数组。 
- js::confirm($message, $okURL, $cancelURL, $okTarget, $cancelTarget)，选择提示。 
- js::locate($url, $target)，跳转页面， target是要跳转的窗口。 
- js::closeWindow(), 关闭窗口。 
- js::refresh($url, $target, $timeout)，刷新页面。 
- js::reload($window), 自动重载某一个窗口。 
- js::exportConfigVars()，将$config里面框架运行的必需信息输出到js中。 
- js::execute($code)，执行某一段js代码。

#### 三、css类
- css::import($url, $version), 导入某一个css文件。 
- css::internal($css)，生成code
