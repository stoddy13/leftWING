new function(){
    
    var system = leftWING = this;

    var activepopup = undefined;
    system.modal = false;
    system.dragged = undefined;
    system.dropzones = [];
    
    system.initialize = function(onSuccess){
        if (typeof onSuccess != 'function'){
            alert("Parameter 'onSuccess' must be a callback function.");
            return;
        }
        system.controls.initialize();
        
        while(document.body.hasChildNodes()){
            document.body.removeChild(document.body.firstChild);
        }
        system.statusBar = system.controls.statusBar()(document.body);
        system.request(
            '\\leftWING\\environment::sendData', {}, system.statusBar.update,
            function(response){
                if(response.error.code != 0){
                    alert(response.error.message);
                    return;
                }
                system.application = response.data.application;
                system.session = response.data.session;
                system.availableLanguages = response.data.availableLanguages;
                onSuccess();
            }
        );
        
    };
    system.request = function(method, parameters, progressHandler, successHandler){

        var request = null;
        try{
            request = new XMLHttpRequest();
        }
        catch(Microsoft){
            try{
                request = new ActiveXObject("Msxml2.XMLHTTP");
            }
            catch (noMicrosoft){
                try{
                    request = new ActiveXObject("Microsoft.XMLHTTP");
                } 
                catch(failed){
                    request = null;
                }
            }  
        }
        if(this.request == null)
            throw 'Couldn\'t create \'XMLHttpRequest\'.';
        
        request.onreadystatechange = function(){
            
            if(this.readyState != 4)
                progressHandler([
                    "Initializing request ...",
                    "Connection to server established ...",
                    "Response received ...",
                    "Processing response ..."][this.readyState]);
            else if(this.status == 200){
                //alert(request.responseText);
                var response = eval('(' + this.responseText + ')');
                var error = response.error;
                if(error && error.code == 10)
                    alert(error.message);
                else{
                    progressHandler('OK');
                    successHandler(response);
                }
            }
            else
                this.alertError('HTTP', this.request.status, this.request.statusText);
        };
        
        var data = ['t=a', 'm=' + method];
        
        for(var key in parameters){
            if(parameters[key] instanceof Array){
                for(var i = 0; i < parameters[key].length; i++)
                    data.push(encodeURIComponent(key + '[]') + '=' +
                              encodeURIComponent(parameters[key][i]));
            }
            else
                data.push(encodeURIComponent(key) + '=' +
                          encodeURIComponent(parameters[key]));
        }
        data = data.join('&');
        url = 'index.php'
        //alert("url: " + url + "\ndata: " + data);
        request.open('post', url, true);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.setRequestHeader('Content-length', data.length);
        request.setRequestHeader('Connection', 'close');
        request.send(data);
    };
    system.logout = function logout(){
    
        system.request(
            'leftWING\\websession::logout',
            {},
            status.update,
            function(response){location.href = location.href;}
        );
    };
    system.base = {
        
        stringFormat: function(){ // variable length argument list

            var args = arguments;
            for(var i = 1; i < args.length; i++){
                args[0] = args[0].replace(/(%d|%lf|%s)/, args[i]);
            }
            return args[0];
        },
        
        arrayContainsItem: function(array, item){
            
            var n = array.length;
            for(var i = 0; i < n && array[i] != item; i++);
            return (i < n);
        },
        
        arrayRemoveItem: function(array, item){
            
            var n = array.length;
            for(var i = 0; i < n && array[i] != item; i++);
            if(i < n){
                for(var j = i + 1; j < n; j++)
                    array[i] = array[j];
                array.pop();
            }
        },
        
        arraySum: function(array){
            
            var sum = 0;
            for(var i = 0; i < array.length; i++)
                sum += parseFloat(array[i]);
            return sum;
        },
        cssValues: function(node, properties){
    
            var result = [];
            var style = window.getComputedStyle(node, null);
            for(var i = 1; i < arguments.length; i++)
                result.push(style.getPropertyValue(arguments[i]));
            return result;
        },
        cssHSpace: function(node){
            
            return system.base.cssHSpaceLeft(node) + system.base.cssHSpaceRight(node);
        },
        cssVSpace: function(node){
            
            return system.base.cssVSpaceTop(node) + system.base.cssVSpaceBottom(node);
        },
        cssHSpaceLeft: function(node){
            
            return system.base.arraySum(system.base.cssValues(node, 'border-left-width','padding-left'));
        },
        cssVSpaceTop: function(node){
            
            return system.base.arraySum(system.base.cssValues(node, 'border-top-width','padding-top'));
        },
        cssHSpaceRight: function(node){
            
            return system.base.arraySum(system.base.cssValues(node, 'border-right-width', 'padding-right'));
        },
        cssVSpaceBottom: function(node){
            
            return system.base.arraySum(system.base.cssValues(node, 'border-bottom-width', 'padding-bottom'));
        },
        addStyle: function(node, styleToAdd){
            
            var existingClassNames = node.className.trim().split(/\s+/);
            var addedClassNames = styleToAdd.trim().split(/\s+/);
            for(var i = 0; i < addedClassNames.length; i++){
                var addedClassName = addedClassNames[i];
                if(!system.base.arrayContainsItem(existingClassNames, addedClassName))
                    existingClassNames.push(addedClassName);
            }
            node.className = existingClassNames.join(' ');
        },
        removeStyle: function(node, removedStyle){
            
            var existingClassNames = node.className.trim().split(/\s+/);
            var removedClassNames = removedStyle.trim().split(/\s+/);
            var survivingClassNames = [];
            for(var i = 0; i < existingClassNames.length; i++){
                var existingClassName = existingClassNames[i];
                if(!system.base.arrayContainsItem(removedClassNames, existingClassName))
                    survivingClassNames.push(existingClassName);
            }
            node.className = survivingClassNames.join(' ');
        },
        getPosition: function(node){
        
            var container = node;
            var left = 0;
            var top = 0;
            do{
                left += container.offsetLeft;
                top += container.offsetTop;
            }while(container = container.offsetParent);
            return {'x': left, 'y': top};
        },
        positionNode: function(node, position){
            
            var left = position.x;
            var top = position.y;
            
            var right = window.innerWidth - left;
            if(right < node.offsetWidth && right < left)
                left -= node.offsetWidth;
            left = Math.max(0, left);
            
            var bottom = window.innerHeight - top;
            if(bottom < node.offsetHeight && bottom < top)
                top -= node.offsetHeight;
            top = Math.max(0, top);

            node.style.left = left + 'px';
            node.style.top = top + 'px';
            
        },
        positionToMouse: function(node, event){
            
            system.base.positionNode(node, {x: event.clientX, y: event.clientY});
        },
        mouseover: function(node, event){
            
            var nodePosition = system.base.getPosition(node);
            var left = nodePosition.x;
            var top = nodePosition.y;
            var right = left + node.offsetWidth;
            var bottom = top + node.offsetHeight;
            return (left <= event.pageX && event.pageX < right &&
                    top < event.pageY && event.pageY < bottom);
        },
        createNode: function(location, tagName, style){
            
            var node = document.createElement(tagName);
            if(location.tagName)
                location.appendChild(node);
            else{
                if(location.nextSibling)
                    location.parentNode.insertBefore(node, location.nextSibling);
                else
                    location.parentNode.appendChild(node);
            }
            if(style)
                system.base.addStyle(node, style);
            return node;
        }
    };
    system.controls = {
        
        nodes: [],
        activeControl: undefined,
        tabbedControls: [],
        
        initialize: function(){
            system.controls.nodes = [];
            system.controls.activeControl = undefined;
            tabbedControls = [];
        },
        createControlNode: function(location, tagName, style){
                
            var node = system.base.createNode(
                location, tagName, style);
            system.base.addStyle(node, 'control');
            system.controls.nodes.push(node);
            return node;
        },
        createIcon: function(src, string){
        
            var div = system.controls.createControlNode(document.body, 'div', 'dragicon');
            var img = leftWING.base.createNode(div, 'img');
            img.src = src;
            img.alt = '';
            img.height = '30';
            img.hspace = '5';
            div.appendChild(document.createTextNode(string));
            return div;   
        },
        removeControlNode: function(node){
            
            system.base.arrayRemoveItem(system.controls.nodes, node);
            node.parentNode.removeChild(node);
        },
        onResize: function(event){
            
            for(i in system.controls.nodes){
                var node = system.controls.nodes[i];
                if(node.adjustSize){
                    var handlingNode = node;
                    var lookup = handlingNode;
                    do{
                        lookup = lookup.parentNode;
                        if(lookup && lookup.adjustSize)
                            handlingNode = lookup;
                    }while(lookup && (lookup != document.body));
                    handlingNode.adjustSize();
                }
            }
        },
        activateControl: function(control){
    
            if(system.controls.activeControl == control)
                return;
            if(system.controls.activeControl)
                system.base.removeStyle(system.controls.activeControl, 'activecontrol');
            system.controls.activeControl = control;
            system.base.addStyle(system.controls.activeControl, 'activecontrol')
        },
        systemMenu: function(label){
        
            return [
                label, function(){
                    
                    return [
                        [
                            [
                                'Change your password',
                                function(position){alert('Not yet implemented.');}
                            ],
                            [
                                'Change your user interface language',
                                function(position){alert('Not yet implemented.');}
                            ],
                            [
                                'Logout',
                                function(position){leftWING.logout();}
                            ]
                            
                        ]
                    ];
                }
            ];
        },
        setMoveable: function(node, onMove, onStopmove){
            
            node.startmove = function(event){    
        
                window.addEventListener('mouseup', node.stopmove, false);
                window.addEventListener('mousemove', node.move, false);
                node.page = system.base.getPosition(node);
                node.mouseOffset = {};
                node.mouseOffset.x = event.pageX - node.page.x;
                node.mouseOffset.y = event.pageY - node.page.y;
            };
           
            node.move = function(event){
                
                if(node.mouseOffset){
                    node.style.position = 'absolute';
                    node.style.left = (event.pageX - node.mouseOffset.x) + 'px';
                    node.style.top = (event.pageY - node.mouseOffset.y) + 'px';
                    if(node.style.visibility == 'hidden')
                        node.style.visibility = 'visible';
                    if(onMove)
                        onMove(event);
                }
            };
            
            node.stopmove = function(event){
                
                node.mouseOffset = null;
                window.removeEventListener('mouseup', node.stopmove, false);
                window.removeEventListener('mousemove', node.move, false);
                if(onStopmove)
                    onStopmove(event);
            };
        },
        makeMoveable: function(node){
            
            system.controls.setMoveable(node);
            
            node.addEventListener('mousedown', function(event){

                if(event.target == node || event.target.parentNode == node)
                    node.startMove(event);
            });
        },
        makeItemsDraggable: function(list, getDragInfo){
        
            list.addEventListener('mousedown', function(event){
                
                var item;
                if((event.button != 0) ||
                   ((item = event.target) == list))
                    return;
                while(item.parentNode != list)
                    item = item.parentNode;
                system.dragged = getDragInfo(item);
                if(!system.dragged.icon)
                    return;
                
                var page = system.base.getPosition(item);
                system.dragged.icon.style.left = (event.clientX - 30) + 'px';
                system.dragged.icon.style.top = (page.y - 15) + 'px';
                system.dragged.icon.style.visibility = 'hidden';
                system.controls.setMoveable(system.dragged.icon, function(event){
                
                    var i;
                    for(i = 0; i < system.dropzones.length; i++){
                        var dropzone = system.dropzones[i];
                        if(system.base.mouseover(dropzone.node, event)){
                            if(dropzone.dropable() && !dropzone.active){
                            system.base.addStyle(dropzone.node, 'dropzone');
                            dropzone.active = true;
                        }
                        }
                        else if(dropzone.active){
                            system.base.removeStyle(dropzone.node, 'dropzone');
                            dropzone.active = false;
                        }
                    }
                }, function(event){
                    
                    system.controls.removeControlNode(system.dragged.icon);
                    var n = system.dropzones.length;
                    for(var i = 0; i < n && !system.dropzones[i].active; i++);
                    if(i < n){
                        system.base.removeStyle(system.dropzones[i].node, 'dropzone');
                        system.dropzones[i].active = false;
                        system.dropzones[i].onDrop(event);                        
                    }
                    system.dragged = undefined;
                });
                
                system.dragged.icon.startmove(event);
            });
            
                
        },
        popup: function(getSections){
            
            if(activepopup)
                activepopup.remove({type: 'mousedown'});
            
            var sections = getSections();
            var popup = system.controls.createControlNode(
                document.body, 'div', 'contextmenu');
            var selectedItem = undefined;
            activepopup = popup;
            
            popup.remove = function(){
            
                system.controls.removeControlNode(popup);
                window.removeEventListener('mousedown', popup.remove, false);
                window.removeEventListener('keydown', popup.onKeydown, true);
                popup.removeEventListener('mouseover', popup.onMouseover, false);
                window.removeEventListener('mouseup', popup.preventDefault);
                activepopup = undefined;
            };
            
            popup.selectItem = function(item){
                
                if(item == selectedItem)
                    return;
                if(selectedItem)
                    system.base.removeStyle(selectedItem, 'highlighted');
                selectedItem = item;
                system.base.addStyle(selectedItem, 'highlighted');
            };
            
            popup.selectNextItem = function(){
            
                if(!selectedItem)
                    popup.selectItem(popup.firstChild.firstChild);
                else if(selectedItem.nextSibling)
                    popup.selectItem(selectedItem.nextSibling);
                else if(selectedItem.parentNode.nextSibling)
                    popup.selectItem(selectedItem.parentNode.nextSibling.firstChild);
                else
                    popup.selectItem(popup.firstChild.firstChild);
            };
            
            popup.selectPreviousItem = function(){
                
                if(!selectedItem)
                    popup.selectItem(popup.lastChild.lastChild);
                else if(selectedItem.previousSibling)
                    popup.selectItem(selectedItem.previousSibling);
                else if(selectedItem.parentNode.previousSibling)
                    popup.selectItem(selectedItem.parentNode.previousSibling.lastChild);
                else
                    popup.selectItem(popup.lastChild.lastChild);
            };
            
            popup.onKeydown = function(event){
                
                if(event.keyCode == 9){
                    event.preventDefault();
                    event.stopPropagation();
                }
                else if(event.keyCode == 27)
                    popup.remove();
                else if(event.keyCode == 13)
                    popup.execute(event);
                else if(event.keyCode == 38)
                    popup.selectPreviousItem();
                else if(event.keyCode == 40)
                    popup.selectNextItem();
            };
            
            popup.onMouseover = function(event){

                if(event.target.parentNode.parentNode != popup)
                    return;
                popup.selectItem(event.target);
            };
            
            window.addEventListener('mousedown', popup.remove, false);
            window.addEventListener('keydown', popup.onKeydown, true);
            popup.addEventListener('mouseover', popup.onMouseover);
            popup.addEventListener('mousedown', function(event){event.stopPropagation();});
            window.addEventListener('mouseup', popup.preventDefault);
            
            popup.preventDefault = function(event){
                
                event.preventDefault();
            };
            
            popup.execute = function(event){
                
                var li = selectedItem;
                if(!li)
                    return;
                var handler = sections[li.section][li.item][1];
                var grayed = sections[li.section][li.item][2];
                var position = {};
                if(event.type == 'keydown')
                    position = system.base.getPosition(li);
                else{
                    position.x = event.clientX;
                    position.y = event.clientY;
                }
                popup.remove();
                if(handler && !grayed)
                    handler(position, li.data);                
            };
            
            popup.addEventListener('mouseup', function(event){

                if(event.target.parentNode.parentNode == popup)
                    popup.execute(event);
            });
            
            for(var i = 0; i < sections.length; i++){
                var section = sections[i];
                var sectionlist = system.base.createNode(popup, 'ol');
                for(var j = 0; j < section.length; j++){
                    var li = system.base.createNode(sectionlist, 'li');
                    li.appendChild(document.createTextNode(section[j][0]));
                    li.section = i;
                    li.item = j;
                    if(section[j][2])
                        system.base.addStyle(li, 'grayed');
                    if (section[j][3]) {
                        li.data = section[j][3];
                    }
                }
            };
            
            return popup;
        },
        addContextMenu: function(context, getSections){
            
            context.addEventListener('contextmenu', function(event){
                
                event.preventDefault();
                var popup = system.controls.popup(getSections);
                system.base.positionToMouse(popup, event);
            });
        },
        setSingleSelection: function(list, onChange){
            
            if(!system.base.arrayContainsItem(['table', 'ol'], list.tagName.toLowerCase()))
                throw   'system.conrols.setSingleSelection: ' +
                        'Argument 1: list must be TABLE or DIV.';
            
            list.selectedItem = undefined;
            
            list.selectItem = function(item){
            
                if(list.selectedItem)
                    system.base.removeStyle(list.selectedItem, 'selected');
                list.selectedItem = item;
                system.base.addStyle(item, 'selected');
            };

            list.unselectItem = function(item){

                system.base.removeStyle(item, 'selected');
                if(list.selectedItem)
                    system.base.removeStyle(list.selectedItem, 'selected');
                list.selectedItem = undefined;
            }
            
            list.addEventListener('mousedown', function(event){
            
                var item = event.target;
                if(item == list)
                    return;
                while(item.parentNode != list)
                    item = item.parentNode;
                if(item == list.selectedItem)
                    return;
                list.selectItem(item);
                if(onChange)
                    onChange(item, event);
            });
        },
        button: function(initial){
          
            return function(location){
            
                var container = system.controls.createControlNode(
                    location, 'div', 'button');
                container.innerHTML = initial.label;
                system.base.addStyle(container, 'up');
                
                container.toggleStatus = function(targetStatus, event){
                    
                    if(targetStatus == 'up'){
                        system.base.removeStyle(container, 'down');
                        system.base.addStyle(container, 'up');
                        if(initial.onUp)
                            initial.onUp(event);
                    }
                    else{
                        system.base.removeStyle(container, 'up');
                        system.base.addStyle(container, 'down');
                        if(initial.onDown)
                            initial.onDown(event);
                    }
                };
                
                var mouseupListener = function(event){
                    
                    container.toggleStatus('up', event);
                    window.removeEventListener('mouseup', mouseupListener);
                };
                
                container.addEventListener('mousedown', function(event){
                    
                    window.addEventListener('mouseup', mouseupListener);
                    container.toggleStatus('down', event);
                });
                
                return container;
            };
                
        },
        staticText: function(text){
            return function(location){
                var node = system.base.createNode(location, 'div', 'statictext');
                node.appendTextNode(text);
                return node;
           };
        },
        languageSelector: function(){
            return function(location){
                var container = system.base.createNode(location, 'div');
                var menu = {
                    popupAlign: 'right',
                    keyboardHandling: false,
                    items: [
                        [
                            system.session.language.label,
                            'Click to select another language for this user interface',
                            function(){
                                var items = [];
                                for(var i = 0; i < system.availableLanguages.length; i++){
                                    var language = system.availableLanguages[i];
                                    if (language.id != system.session.language.id){
                                        items.push([
                                        language.label,
                                        function(position, id){
                                            system.request(
                                                '\\leftWING\\environment::changeLanguage', {l:id},
                                                system.statusBar.update,
                                                function(response){
                                                    system.initialize(module);
                                                }
                                            );
                                        },
                                        false,
                                        language.id]);
                                    }
                                }
                                return [items];
                            }
                        ]
                    ]
                };
                return system.controls.menu(menu)(container);
            }
        },
        textLink: function(initial){
            return function(location){
                var container = system.base.createNode(location, 'span', 'text-link');
                container.appendTextNode(initial.text);
                if(initial.title){
                    container.setAttribute('title', initial.title);
                }
                container.addEventListener('mousedown', initial.onClick);
                return container;
            };
        },
        loginLink: function(initial){
            return function(location){
                return system.controls.textLink({
                    text: 'Login',
                    title: 'Click here to login',
                    onClick: function(event){
                        var form = system.controls.form({
                            position: {x: event.clientX, y: 30},
                            header: system.application.name,
                            helpPanel: false,
                            fieldsets: [
                                {
                                    legend: 'Login',
                                    fields: [
                                        system.controls.textField({
                                            name: 'name',
                                            type: 'text',
                                            label: 'Username'
                                        }),
                                        system.controls.textField({
                                            name: 'pass',
                                            type: 'password',
                                            label: 'Password'
                                        })
                                    ]
                                }
                            ],
                            buttons: [
                                [
                                    'Cancel',
                                    function(event){
                                        form.remove();
                                    },
                                    'Cancel'
                                ],
                                [
                                    'OK',
                                    function(event){
                                        form.sendData(function(response){
                                            if(response.error.code == 0){
                                                form.remove();
                                                system.initialize(module);
                                            }
                                        });
                                    },
                                    'Cancel'
                                ]
                            ],
                            store: '\\leftWING\\environment::login'
                        })(document.body);
                    }
                })(location);
                
            };
        },
        utilityBar: function(utilities){
            return function(location){
                var container = system.controls.createControlNode(location, 'ol', 'utilitybar');
                for(var i = 0; i < utilities.length; i++){
                    var utility = utilities[i];
                    var li = system.base.createNode(container, 'li', 'utility');
                    li.appendChild(utility(li));
                }
                return container;
            };
        },
        userAndLanguageMenu: function(initial){
            
            return function(location){
            
                var menu = {
                    popupAlign: 'right',
                    keyboardHandling: false,
                    items: [
                        [
                            system.session.user,
                            'Click here to login',
                            function(){
                                return [[
                                    [
                                        'Login',
                                        function(position, id){
                                            var form = system.controls.form({
                                                position: position,
                                                header: system.application.name,
                                                helpPanel: false,
                                                fieldsets: [
                                                    {
                                                        legend: 'Login',
                                                        fields: [
                                                            system.controls.textField({
                                                                name: 'name',
                                                                type: 'text',
                                                                label: 'Username'
                                                            }),
                                                            system.controls.textField({
                                                                name: 'pass',
                                                                type: 'password',
                                                                label: 'Password'
                                                            })
                                                        ]
                                                    }
                                                ],
                                                buttons: [
                                                    [
                                                        'Cancel',
                                                        function(event){
                                                            form.remove();
                                                        },
                                                        'Cancel'
                                                    ],
                                                    [
                                                        'OK',
                                                        function(event){
                                                            form.sendData(function(response){
                                                                if(response.error.code == 0){
                                                                    form.remove();
                                                                    system.initialize(module);
                                                                }
                                                            });
                                                        },
                                                        'Cancel'
                                                    ]
                                                ],
                                                store: '\\leftWING\\environment::login'
                                            })(document.body);
                                        },
                                        false
                                    ]
                                ]];
                            }
                        ],
                        [
                            system.session.language.label,
                            'Click here to select another language for this user interface',
                            function(){
                                var items = [];
                                for(var i = 0; i < system.availableLanguages.length; i++){
                                    var language = system.availableLanguages[i];
                                    items.push([
                                    language.label,
                                    function(position, id){
                                        system.request(
                                            '\\leftWING\\environment::changeLanguage', {l:id},
                                            system.statusBar.update,
                                            function(response){
                                                system.initialize(module);
                                            }
                                        );
                                    },
                                    (language.id == system.session.language.id),
                                    language.id]);
                                }
                                return [items];
                            }
                        ]
                    ]
                };
                return system.controls.menu(menu)(location);
            }
        },
        statusBar: function(initial){
            
            return function(location){
                
                var container = system.base.createNode(
                    location, 'div', 'statusbar');
                container.appendTextNode(initial && initial.message ? initial.message : 'OK');
                
                container.update = function(message){
                
                    container.innerHTML = message;
                };
                container.remove = function(){
                    system.controls.removeControlNode(container);  
                };
                alert(container.className);
                return container;
            }
        },
        container: function(initial){
    
            return function(location){
        
                var type = (initial && (initial.type == 'horizontal') ? 'horizontal' : 'vertical');
                var container = system.controls.createControlNode(
                    location, 'div', type +'-container');
                
                if(initial.id)
                    container.setAttribute('id', initial.id);
                if(initial.style)
                    system.base.addStyle(container, initial.style);
                if(initial.header)
                    container.header = initial.header(container);
               if(initial.content)
                    container.content = initial.content(container);
                else
                    throw   'system.controls.verticalContainer: ' +
                            'No content supplied.';
                if(initial.footer)
                    container.footer = initial.footer(container);
                
                container.adjustSize = function(){
                    
                    var headerOffset = 0;
                    if(container.header)
                        headerOffset = (type == 'vertical' ? container.header.offsetHeight : container.header.offsetWidth);
                    if(type == 'horizontal')
                        container.content.style.left = headerOffset + 'px';
                    var containerCSSSize = (type == 'vertical' ?
                                            container.offsetHeight - system.base.cssVSpace(container) :
                                            container.offsetWidth - system.base.cssHSpace(container));
                    var contentSize =  containerCSSSize - headerOffset;
                    if(container.footer)
                        contentSize -= (type == 'vertical' ?
                                        container.footer.offsetHeight :
                                        container.footer.offsetWidth);
                    if(type == 'vertical')
                        container.content.style.height = Math.max(0, (contentSize - system.base.cssVSpace(container.content))) + 'px';
                    else
                        container.content.style.width = Math.max(0, (contentSize - system.base.cssHSpace(container.content))) + 'px';
                    if(type == 'horizontal' && container.footer)
                        container.footer.style.left = (headerOffset + container.content.offsetWidth) + 'px';
                    if(container.content.adjustSize)
                        container.content.adjustSize();
                    if(container.header && container.header.adjustSize)
                        container.header.adjustSize();
                    if(container.footer && container.footer.adjustSize)
                        container.footer.adjustSize();
                };
                
                container.setContent = function(createControl){
                    system.controls.removeControlNode(container.content);
                    container.content = createControl(
                        {parentNode: container, nextSibling: container.footer});
                    container.adjustSize();
                    
                };
                
                container.setFooter = function(createControl){
                    
                    if(container.footer)
                        system.controls.removeControlNode(container.footer);
                    container.footer = createControl(container);
                    container.adjustSize();
                    
                };
                container.adjustSize();
                return container;
            }
        },
        scrollBar: function(initial){
        
            var type = (initial && initial.type == 'horizontal' ? 'horizontal' : 'vertical');
        
            system.controls.scrollBar.thumb = function(){
                
                return function(location){
                    
                    var container = system.controls.createControlNode(location, 'div');
                    var thumb = system.base.createNode(container, 'div', 'thumb');
                    
                    container.adjustSize = function(){

                        if(type == 'vertical'){
                            var containerHeight = container.offsetHeight - system.base.cssHSpace(container);
                            var thumbHeight = Math.round((initial.length / initial.total * containerHeight));
                            thumb.style.height = (thumbHeight - system.base.cssHSpace(thumb)) + 'px';
                        }
                    };
                    
                    return container;
                };
            };
            
            return function(location){
                var container = system.controls.container(
                    {
                        type: type,
                        style: type + '-scrollbar',
                        header: system.controls.button({
                            label: (type == 'vertical' ? '▲' : '◄'),
                            onDown: function(event){
                                //alert('down');
                            },
                            onUp: function(event){
                                //alert('up');
                            }
                        }),
                        content: system.controls.scrollBar.thumb(),
                        footer: system.controls.button({
                            label: (type == 'vertical' ? '▼' : '►'),
                            onDown: function(event){
                                //alert('down');
                            },
                            onUp: function(event){
                                //alert('up');
                            }
                        })
                    }
                )(location);
                return container;
            };
        },
        dataList: function(initial){
        
            return function(location){
                
                var itemcount = 0;
                
                var columns = [];
                var container = system.controls.createControlNode(
                    location, 'ol', 'datalist vertical-scrollarea');
            
                container.makeDropzone = function(dropable, onDrop){
                    
                        system.dropzones.push({
                            node: container,
                            dropable: dropable,
                            onDrop: onDrop
                        });
                        
                    };
                container.makeItemsDraggable = function(getDragInfo){
                    
                    system.controls.makeItemsDraggable(container, getDragInfo);
                }
                
                container.addContextMenuSection = function(){
                    
                    return [
                        [
                            'Scroll to top', function(){
                                container.scrollTop = 0;
                            },
                            (container.scrollTop == 0 ? true : false)
                        ],
                        [
                            'Scroll to bottom', function(){
                                container.scrollTop = container.scrollHeight;
                            }
                        ]
                        
                    ];
                };
                
                container.clear = function(){
                    
                    while(container.hasChildNodes())
                        container.removeChild(container.firstChild);
                    container.selectedItem = undefined;
                    itemcount = 0;
                }
                
                container.setColumns = function(cols){
                    columns = cols;
                };
                
                container.getColumns = function(){
                    
                    return columns;
                };
                
                container.getFirstItem = function(){
                    
                    return container.firstChild;
                }
                
                container.getLastItem = function(){
                    
                    return container.lastChild;
                };
                
                container.getSelectedItemData = function(){
                    
                    var data = [];
                    var li = container.selectedItem;
                    data.push(li);
                    for(var i = 0; i < li.childNodes.length; i++){
                        if(i < columns.firstvisible)
                            data.push(li.data[i]);
                        else
                            data.push(li.childNodes[i].firstChild.data);
                    }
                    return data;
                };

                container.itemSelected = function(){

                    return (container.selectedItem ? true : false);
                };
                
                container.getItems = function(){
                    
                    var items = [];
                    for(var i = 0; i < container.childNodes.length; i++){
                        var item = [];
                        var li = container.childNodes[i];
                        for(j = 0; j < columns.labels.length; j++){
                            if(j < columns.firstvisible)
                                item.push(li.data[j]);
                            else
                                item.push(li.childNodes[j - columns.firstvisible].innerHTML);
                        }
                        items.push(item);
                    }
                    return items;
                }

                system.controls.setSingleSelection(container, function(item, event){
                    if(container.onSelectionChanged)
                        container.onSelectionChanged(item, event);
                });
                
                container.appendItem = function(item){
                    var li = system.base.createNode(container, 'li');
                    li.data = [];
                    for(var j = 0; j < item.length; j++){
                        if(j < columns.firstvisible)
                            li.data.push(item[j]);
                        else{
                            var div = system.base.createNode(li, 'div');
                            div.appendChild(document.createTextNode(item[j]));
                        }
                    }
                    itemcount++;
                };
                
                container.modifyItem = function(itemData){
                    
                    for(var i = 1; i < itemData.length; i++){
                        if((i - 1) < columns.firstvisible)
                            itemData[0].childNodes[i - 1] = itemdata[i];
                        else
                            itemData[0].childNodes[i - 1].firstChild.data = itemData[i];
                    }
                };

                container.removeItem = function(item){
                    
                    container.unselectItem(item);
                    container.removeChild(item);
                };
                
                container.appendItems = function(items){
                    
                    for(var i = 0; i < items.length; i++)
                        container.appendItem(items[i]);
                };
                
                container.getItemCount = function(){
                    
                    return itemcount;
                };
                
                container.addEventListener('scroll', function(event){
                        
                    if((container.scrollHeight - container.scrollTop) <= container.offsetHeight){
                        if(container.fetchItems)
                            container.fetchItems();
                    }
                });
                
                return container;
            };
        },
        dataTable: function(initial){
            
            system.controls.dataTable.header = function(){
          
                return function(location){
                    
                    var container = system.controls.createControlNode(
                        location, 'div', 'datatable-header');
                    system.base.createNode(system.base.createNode(system.base.createNode(
                        container, 'table'), 'tr'), 'td').innerHTML = '…';
                    
                    container.setLabels = function(labels){

                        while(container.firstChild.firstChild.hasChildNodes())
                            container.firstChild.firstChild.removeChild(
                                container.firstChild.firstChild.firstChild);
                        for(var i = 0; i < labels.length; i++){
                            var label = labels[i];
                            system.base.createNode(container.firstChild.firstChild, 'td').innerHTML = label;
                        }
                    };
                    
                   
                    container.adjustWidths = function(table){

                        var n = table.firstChild.childNodes.length;
                        for(var i = 0; i < n; i++){
                            var td = table.firstChild.childNodes[i];
                            var headertd = container.firstChild.firstChild.childNodes[i];
                            headertd.style.width = Math.max(
                                td.offsetWidth - system.base.cssHSpace(td),
                                headertd.offsetWidth - system.base.cssHSpace(headertd)
                            ) + 'px';
                        }
                    }
                    
                    return container;
                }
            };
            
            system.controls.dataTable.body = function(){
                
                var itemcount = 0;
                
                return function(location){
                    
                    var columns = [];
                    var container = system.controls.createControlNode(
                        location, 'div', 'datatable-body vertical-scrollarea');
                    system.base.createNode(container, 'table');
                    
                    container.setColumns = function(cols){
                        
                        columns = cols;  
                    };
                    
                    container.makeDropzone = function(dropable, onDrop){
                    
                        system.dropzones.push({
                            node: container,
                            dropable: dropable,
                            onDrop: onDrop
                        });
                        
                    };
                    
                    container.makeItemsDraggable = function(getDragInfo){
                        
                        system.controls.makeItemsDraggable(container.firstChild, getDragInfo);  
                    };
                    
                    container.addContextMenuSection = function(){
                        
                        return [
                            [
                                'Scroll to top', function(){
                                    container.scrollTop = 0;
                                },
                                (container.scrollTop == 0 ? true : false)
                            ],
                            [
                                'Scroll to bottom', function(){
                                    container.scrollTop = container.scrollHeight;
                                }
                            ]
                        ];
                    };
                    
                    container.clear = function(){
                    
                        while(container.firstChild.hasChildNodes())
                            container.firstChild.removeChild(container.firstChild.firstChild);
                        container.firstChild.selectedItem = undefined;
                        itemcount = 0;
                    };
                    
                    container.appendItem = function(item){
                        
                        var tr = system.base.createNode(container.firstChild, 'tr');
                        tr.data = [];
                        itemcount++;
                        for(var i = 0; i < item.length; i++){
                            if(i < columns.firstvisible)
                                tr.data.push(item[i]);
                            else
                                system.base.createNode(tr, 'td').appendChild(document.createTextNode(item[i]));
                        }
                    };
                    
                    container.modifyItem = function(itemData){
                        
                        for(var i = 1; i < itemData.length; i++)
                            if((i - 1) < columns.firstvisible)
                                itemData[0].data[i - 1] = itemData[i];
                            else
                                itemData[0].childNodes[i - 1].firstChild.data = itemData[i];
                    };

                    container.removeItem = function(item){
                        
                        container.firstChild.unselectItem(item);
                        container.firstChild.removeChild(item);
                    };
                    
                    container.appendItems = function(items){
                        
                        for(var i = 0; i < items.length; i++)
                            container.appendItem(items[i]);
                    };
                    
                    container.getFirstItem = function(){
                        
                        return container.firstChild.firstChild;
                    }
                    
                    container.getLastItem = function(){
                        
                        return container.firstChild.lastChild;  
                    };
                    
                    container.selectItem = function(item){
                        
                        container.firstChild.selectItem(item);
                        if(container.onSelectionChanged)
                            container.onSelectionChanged(item);
                    }
                    
                    container.getSelectedItemData = function(){
                        
                        var data = [];
                        var tr = container.firstChild.selectedItem;
                        data.push(tr);
                        for(var i = 0; i < columns.labels.length; i++)
                            if(i < columns.firstvisible)
                                data.push(tr.data[i]);
                            else
                                data.push(tr.childNodes[i - columns.firstvisible].firstChild.data);
                        return data;
                    };

                    container.itemSelected = function(){

                        return (container.firstChild.selectedItem ? true : false);
                    };


                    container.getItemCount = function(){
                        
                        return itemcount;
                    };
                    
                    return container;
                }
                
            };
        
            return function(location){
                
                var columns = [];
                var container = system.controls.container(
                    {
                        type: 'vertical',
                        header: system.controls.dataTable.header(),
                        content: system.controls.dataTable.body()
                    }
                )(location);
                
                container.addContextMenuSection = container.content.addContextMenuSection;
                container.setColumns = function(cols){
                    
                    columns = cols;
                    var labels = [];
                    for(var i = columns.firstvisible; i < columns.labels.length; i++)
                        labels.push(columns.labels[i]);
                    container.header.setLabels(labels);
                    container.content.setColumns(cols);
                };
                container.getColumns = function(){return columns;};
                container.getItemCount = container.content.getItemCount;
                container.makeDropzone = function(dropable, onDrop){
                    
                    container.content.makeDropzone(dropable, onDrop);
                };
                
                container.makeItemsDraggable = function(getDragInfo){
                    
                    container.content.makeItemsDraggable(getDragInfo);
                               
                }
                system.controls.setSingleSelection(container.content.firstChild, function(item, event){
                    if(container.onSelectionChanged)
                        container.onSelectionChanged(item, event);
                });
                
                container.clear = function(){
                
                    container.content.clear();  
                };

                container.appendItems = function(items){
                    
                    if(items.length == 0)
                        return;
                    container.content.appendItems(items);
                    container.header.adjustWidths(container.content.firstChild);
                };
                
                container.getItems = function(){
                
                    var items = [];
                    for(var i = 0; i < container.content.firstChild.childNodes.length; i++){
                        var item = [];
                        var tr = container.content.firstChild.childNodes[i];
                        for(var j = 0; j < columns.labels.length; j++){
                            if(j < columns.firstvisible)
                                item.push(tr.data[j]);
                            else{
                                var td = tr.childNodes[j - columns.firstvisible];
                                item.push(td.firstChild.data);
                            }
                        }
                        items.push(item);
                    }
                    return items;
                };
                
                container.appendItem = function(item){
                    
                    container.content.appendItem(item);
                    container.header.adjustWidths(container.content.firstChild);
                };
                
                container.modifyItem = function(itemData){
                    
                    container.content.modifyItem(itemData);  
                };

                container.removeItem = function(item){

                    container.content.removeItem(item);
                };
               
                container.getFirstItem = function(){
                    
                    return container.content.getFirstItem();
                }
                
                container.getLastItem = function(){
                
                    return container.content.getLastItem();
                };
                
                container.selectItem = function(item){
                    
                    container.content.selectItem(item);
                };
               
                container.getSelectedItemData = function(){
                    
                    return container.content.getSelectedItemData();
                };

                container.itemSelected = function(){

                    return container.content.itemSelected();
                };
                
                container.content.addEventListener('scroll', function(event){
                        
                    if((container.content.scrollHeight - container.content.scrollTop) <= container.content.offsetHeight){
                        if(container.fetchItems)
                            container.fetchItems();
                    }
                });
                
               
                return container;
            }
        },
        dataView: function(initial){
            
            return function(location){
                
                var servermethod = (initial && initial.servermethod ? initial.servermethod : undefined);
                var total = 0xffffffff;
                var size = 500;
                var requestpending = false;
                var type = ((initial && (initial.type == 'table')) ? 'table' : 'list');
                var dragInfo = undefined;
                var dropInfo = undefined;
                    
                var content = system.controls.dataTable();
                var style = 'datatable';
                if(type == 'list'){
                    content = system.controls.dataList();
                    style = 'datalist';
                }
                var container = system.controls.container(
                   {
                        id: initial.id,
                        type: 'vertical',
                        style: style + ' dataview',
                        content: content,
                        footer: system.controls.statusBar()
                   }
                )(location);
                container.adjustSize();
                
                container.makeDropzone = function(dropable, onDrop){
                    
                    dropInfo = {
                        dropable: dropable,
                        onDrop: onDrop
                    };
                    container.content.makeDropzone(dropable, onDrop); 
                };
                
                container.makeItemsDraggable = function(getDragInfo){
                    
                    dragInfo = {getDragInfo: getDragInfo};
                    container.content.makeItemsDraggable(getDragInfo);  
                };
                
                container.toggleType = function(targetType){
                    
                    type = targetType;
                    var items = container.content.getItems();
                    var columns = container.content.getColumns();
                    container.setContent(targetType == 'table' ?
                        system.controls.dataTable() :
                        system.controls.dataList()
                    );
                    if(dragInfo)
                        container.content.makeItemsDraggable(dragInfo.getDragInfo);
                    if(dropInfo)
                        container.content.makeDropzone(dropInfo.dropable, dropInfo.onDrop);
                    container.content.setColumns(columns);
                    container.content.appendItems(items);
                    container.content.fetchItems = container.fetchItems;
                    container.content.onSelectionChanged = function(item){
                        if(initial.onSelectionChanged)
                            initial.onSelectionChanged(item);
                    };
                };
                
                system.controls.addContextMenu(container, function(event){
                    
                    var sections = [
                        [
                            [
                                'Listview', function(){container.toggleType('list');},
                                type == 'list'
                            ],
                            [
                                'Details', function(){container.toggleType('table');},
                                type == 'table'
                            ]
                        ],
                        [
                            [
                                'Requery', function(){container.refill();}
                            ]
                        ]
                    ];
                    
                    if(container.addContextMenuSections){
                        var additionalSections = container.addContextMenuSections();
                        for(var i = 0; i < additionalSections.length; i++)
                            sections.push(additionalSections[i]);                            
                    }
                    
                    if(container.content.addContextMenuSection)
                        sections.push(container.content.addContextMenuSection());
                    
                    return sections;
                });
                
                container.clear = function(){
                  
                    container.content.clear();
                    total = 0xffffffff;
                };
                
                container.refill = function(){
                    
                    container.clear();
                    container.fetchItems();
                }
                
                container.appendItem = function(item){
                    
                    container.content.appendItem(item);
                };
                
                container.modifyItem = function(itemData){
                
                    container.content.modifyItem(itemData);
                };

                container.removeItem = function(item){
                    
                    container.content.removeItem(item);
                };

                container.getSelectedItemData = function(){
                    
                    return container.content.getSelectedItemData();
                };
                
                container.getFirstItem = function(){
                    
                    return container.content.getFirstItem();
                }
                
                container.getLastItem = function(){
                
                    return container.content.getLastItem();  
                };
                
                container.selectItem = function(item){
                    
                    container.content.selectItem(item);
                };

                container.itemSelected = function(){

                    return container.content.itemSelected();
                }

                container.getItemCount = function(){
                    
                    return container.content.getItemCount();
                };
                                
                container.fetchItems = function(){
                    
                    if(!servermethod)
                        if(initial && initial.fetchItems)
                            initial.fetchItems(start);
                        else
                            return;
                    var start = container.getItemCount();    
                    if(start >= total)
                        return;
                    if(requestpending)
                        return;
                    requestpending = true;
                    
                    var parameters = (initial.onParameters ? initial.onParameters() : {});
                    parameters['limitstart'] = start;
                    parameters['limitsize'] = size;
                    
                    system.request(
                        servermethod,
                        parameters,
                        container.footer.update,
                        function(response){
                            requestpending = false;
                            if(response.error.code != 0){
                                alert(response.error.message);
                                return;
                            }
                            container.content.appendItems(response.data.items);
                            total = response.data.total;
                            container.footer.update(container.getItemCount() + ' of ' + total);
                            container.adjustSize();
                        }
                    );    
                };
                
                if(servermethod){
                    system.request(
                        servermethod,
                        {columns: true},
                        container.footer.update,
                        function(response){
                            container.content.setColumns(response.columns);
                            container.content.fetchItems = container.fetchItems;
                            container.content.fetchItems();
                        }
                    );
                }
                
                if(initial.onActivation){
                    
                    container.addEventListener('mousedown', function(event){
                    
                        initial.onActivation(container);
                    });
                }
                
                container.content.onSelectionChanged = function(item, event){
                    if(initial.onSelectionChanged)
                        initial.onSelectionChanged(item, event);
                };
                
                return container;
            }
        },
        textField: function(initial){
        
            return function(location){
                
                var container = system.base.createNode(
                    location, 'fieldset', 'field');
                system.base.createNode(container, 'legend').innerHTML = initial.label + ':';
                var input = system.base.createNode(container, 'input');
                input.setAttribute('type', initial.type);
                input.setAttribute('name', initial.name);
                if(system.base.arrayContainsItem(['text', 'password'], initial.type))
                    input.setAttribute('maxlength', '255');
                if(initial.value)
                    input.setAttribute('value', initial.value);
                    
                input.getName = function(){
                    
                    return input.getAttribute('name');
                };

                input.appendHelp = function(location){

                    if(initial.help){
                        system.base.createNode(location, 'h2').innerHTML = initial.label;
                        system.base.createNode(location, 'p').innerHTML = initial.help;
                    }
                    
                }
                
                return input;
            };
        },
        selectField: function(initial){
        
            return function(location){
                
                var container = system.base.createNode(
                    location, 'fieldset', 'field');
                system.base.createNode(container, 'legend').innerHTML = initial.label + ':';
                var select = system.base.createNode(container, 'select');
                select.setAttribute('name', initial.name);
                select.setAttribute('size', 1);
                for(var i = 0; i < initial.values.length; i++){
                    var option = system.base.createNode(select, 'option');
                    option.setAttribute('value', initial.values[i][0]);
                    if(initial.values[i][0] == initial.selected)
                        option.setAttribute('selected', 'selected');
                    option.appendChild(document.createTextNode(initial.values[i][1]));
                }
                
                    
                select.getName = function(){
                    
                    return select.getAttribute('name');
                };

                select.appendHelp = function(location){

                    if(initial.help){
                        system.base.createNode(location, 'h2').innerHTML = initial.label;
                        system.base.createNode(location, 'p').innerHTML = initial.help;
                    }
                    
                }
                
                return select;
            };    
        },
        form: function(initial){
            
            return function(location){
                var container = system.controls.createControlNode(
                    location, 'div', 'form');
                system.controls.makeMoveable(container);
                
                system.base.createNode(container, 'div').innerHTML = initial.header;
                
                var clientarea = system.base.createNode(container, 'div', 'clientarea');
                if(initial.helpPanel){
                    var leftpanel = system.base.createNode(clientarea, 'div');
                    var rightpanel = system.base.createNode(clientarea, 'div');
                }

                container.fields = {};
                
                for(var i = 0; i < initial.fieldsets.length; i++){
                    var fieldset = initial.fieldsets[i];
                    var fs = system.base.createNode((initial.helpPanel ? leftpanel : clientarea), 'fieldset', 'fieldset');
                    system.base.createNode(fs, 'legend').innerHTML = fieldset.legend;
                    for(var j = 0; j < fieldset.fields.length; j++){
                        var field = fieldset.fields[j](fs);
                        container.fields[field.getName()] = field;
                        if(i == 0 && j == 0)
                            field.focus();
                        if(initial.helpPanel){
                            field.appendHelp(rightpanel);
                        }
                    }
                }

                
                var buttons = system.base.createNode(container, 'div', 'buttons');
                container.status = system.controls.statusBar()(buttons);

                for(var i = 0; i < initial.buttons.length; i++){
                    var button = system.base.createNode(buttons, 'input');
                    button.setAttribute('type', 'button');
                    button.setAttribute('value', initial.buttons[i][0]);
                    button.handler = initial.buttons[i][1];
                    button.onclick = function(event){event.target.handler(container, event);};
                }
                
                system.base.positionNode(container, initial.position);
                
                container.sendData = function(onSent){

                    var parameters = {};
                    if(initial.hiddenfields)
                        for(var i = 0; i < initial.hiddenfields.length; i++){
                            var field = initial.hiddenfields[i];
                            parameters[field[0]] = field[1];
                        }
                    for(var name in container.fields)
                        parameters[name] = container.fields[name].value;
                    system.request(
                        initial.store,
                        parameters,
                        container.status.update,
                        function(response){
                            if(response.error.code != 0){
                                alert(response.error.message);
                                return;
                            }
                            onSent(response);
                        }
                   );
                }

                
                container.remove = function(){
                
                    window.removeEventListener('mousedown', container.modal, true);
                    window.removeEventListener('mouseup', container.modal, true);
                    window.removeEventListener('click', container.modal, true);
                    window.removeEventListener('keydown', container.modal, true);
                    window.removeEventListener('contextmenu', container.modal, true);
                    system.controls.removeControlNode(container);
                    system.modal = false;
                };
                
                container.modal = function(event){
                    
                    system.modal = true;
                    if(event.type == 'keydown'){
                        var buttons = initial.buttons;
                        var n = buttons.length;
                        if(event.keyCode == 27){
                            for(var i = 0; i < n && buttons[i][2] != 'Cancel'; i++);
                            if(i < n)
                                buttons[i][1](event);
                        }
                        else if(event.keyCode == 13){
                            for(var i = 0; i < n && buttons[i][2] != 'OK'; i++);
                            if(i < n)
                                buttons[i][1](event);
                        }
                    }

                    var parent = event.target;
                    while(parent && parent != container)
                        parent = parent.parentNode;
                    if(parent != container){
                        event.stopPropagation();
                        event.preventDefault();
                    }
                        
                };
                
                window.addEventListener('mousedown', container.modal, true);
                window.addEventListener('mouseup', container.modal, true);
                window.addEventListener('click', container.modal, true);
                window.addEventListener('keydown', container.modal, true);
                window.addEventListener('contextmenu', container.modal, true);
                
                
                return container;
            };
        },
        menu: function(initial){
            
            return function(location){
                
                var container = system.base.createNode(location, 'ol', 'menu');
                if(initial.id){
                    container.setAttribute('id', initial.id);
                }
                for(var i = 0; i < initial.items.length; i++){
                    var item = initial.items[i];
                    var li = system.base.createNode(container, 'li');
                    if(initial.keyboardHandling){
                        li.innerHTML = '<span>' + item[0][0] + '</span>' + item[0].substr(1);
                    }
                    else{
                        li.appendTextNode(item[0]);
                    }
                    if(item[1]){
                        li.setAttribute("title", item[1]);
                    }
                    li.index = i;
                }
                
                container.addEventListener('contextmenu', function(event){
                    event.preventDefault();
                })
                
                container.popup = function(item){
                    
                    var popup = system.controls.popup(initial.items[item.index][2]);
                    var position = item.getPosition();
                    position.y += item.offsetHeight;
                    if (initial.popupAlign && initial.popupAlign == 'right'){
                        position.x = position.x + item.offsetWidth - popup.offsetWidth;
                    }
                    
                    system.base.positionToMouse(popup, {clientX: position.x, clientY: position.y});
                }
                
                container.addEventListener('mousedown', function(event){
                    
                    event.stopPropagation();
                    var item = event.target;
                    if(item.parentNode == container)
                        container.popup(item);
                });
                if(initial.keyboardHandling) {
                    window.addEventListener('keydown', function(event){
                        if(event.altKey){
                            if(activepopup)
                                activepopup.remove({type: 'mousedown'});
                            var key = String.fromCharCode(event.keyCode).toLowerCase();
                            for(var i = 0; (i < initial.items.length) && (initial.items[i][0][0].toLowerCase() != key); i++);
                            if(i < initial.items.length){
                                event.preventDefault();
                                container.popup(container.childNodes[i]);
                            }
                        }
                    });
                }
                return container;
            }
        },
        register: function(initial){
            
            return function(location){

                var container = system.controls.createControlNode(
                    location, 'div', 'register');
                container.setAttribute('id', initial.id);
            };
        },
        createTableFormRow: function(table, label){
        
            var tr = system.base.createNode(table, 'tr');
            var td = system.base.createNode(tr, 'td');
            td.appendChild(document.createTextNode(label + ':'));
            return tr;
            
        },
        createTableFormTextField: function(table, label, fieldname, value, help){
            
            var tr = system.controls.createTableFormRow(table, label);
            var td = system.base.createNode(tr, 'td');
            td.appendChild(document.createTextNode(value));
            tr.fieldname = fieldname;
            tr.help =  help;
            tr.type = 'text';
        },
        createTableFormSelect: function(table, label, fieldname, selected, values, help){
            
            var tr = system.controls.createTableFormRow(table, label);
            var td = system.base.createNode(tr, 'td');
            for(var i = 0; i < values.length && values[i][0] != selected; i++);
            var value = '';
            if(i < values.length)
                value = values[i][1];
            td.appendChild(document.createTextNode(value));
            tr.fieldname = fieldname;
            tr.help =  help;
            tr.type = 'select';
            tr.selected = selected;
            tr.values = values;
        }
    };
    addEventListener('resize', system.controls.onResize);
    addEventListener('keydown', function(event){

        if(!system.modal && event.keyCode == 9){
            event.preventDefault();
            var n = system.controls.tabbedControls.length;
            for(var i = 0; i < n && system.controls.tabbedControls[i] != system.controls.activeControl; i++);
            if(i < n)
                system.controls.activateControl(system.controls.tabbedControls[(i + n + (event.shiftKey ? -1 : 1)) % n]);
            else if(n)
                system.controls.activateControl(system.controls.tabbedControls[0]);
        }
    });
    
};













