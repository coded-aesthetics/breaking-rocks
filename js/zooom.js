(function () {
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;

    var container,stats;

    var camera, scene, renderer;

    var mouseX = 0, mouseY = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    var triangles;

    var pointCloud = [];
    var pcl = [];

    var numVertices =1000;
    var w = 598/2;
    var h = 362/2;
    var vertices = [];
    var colors = [];
    var meshes = [];
    var blob;
    var dirs = [];
    var texture1;
    var material1;
    var controls;
    var sphereObj;
    var timePassed = 0;
    var blobChildren = [];
    var first = true;
    var raycaster= new THREE.Raycaster();
    console.log(raycaster);
    var INTERSECTED;

    window.onresize = function () {
			SCREEN_WIDTH = window.innerWidth;
			SCREEN_HEIGHT = window.innerHeight-4;
			camera = new THREE.PerspectiveCamera( 35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 25000 );
        camera.position.z = 200;
			renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
		};

    function partitionCube(pos, size, num, parent) {
        var c = new THREE.Vector3(pos.x-size/2.0, pos.y-size/2.0, pos.z-size/2.0);
        var cur = new THREE.Vector3(c.x, c.y, c.z);
        var delta = size / num;
        console.log(delta);
        for (var x = 0; x < num; x++) {
            for (var y = 0; y < num; y++) {
                for (var z = 0; z < num; z++) {
                    cur = new THREE.Vector3(c.x+delta*x, c.y+delta*y, c.z+delta*z);
                    var doCube = Math.random() < 0.5;
                    if (doCube) {
                        //var geometry = new THREE.BoxGeometry(delta, delta, delta);
                        //var geometry = new THREE.DodecahedronGeometry( delta*0.707  );
                        //var geometry = new THREE.SphereGeometry( delta, 32,32 );
                       //var geometry = new THREE.OctahedronGeometry( delta*0.707 );
                        var geometry = new THREE.IcosahedronGeometry( delta*0.707 );
                        var spMat2 = new THREE.MeshPhongMaterial({
                            // light
                            specular: '#1001aa',
                            // intermediate
                            color: '#1001ff',
                            // dark
                            emissive: '#006063',
                            shininess: 5
                        });
                        //var spMat2 = new THREE.MeshLambertMaterial({color: colors[Math.floor(Math.random()*10)]});
                        spMat2.shading = THREE.NoShading;
                        spMat2.emissive.setHex( colors[Math.floor(Math.random()*10)] );
                        //var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
                        var cube = new THREE.Mesh(geometry, spMat2);
                        //geometry.position.set(new THREE.Vector3(cur.x, cur.y, cur.z));
                        cube.applyMatrix( new THREE.Matrix4().makeTranslation(cur.x,cur.y, cur.z) );
                        cube.cust_size = delta;
                        cube.cust_pos = new THREE.Vector3(cur.x,cur.y, cur.z);
                        cube.lookAt(new THREE.Vector3(Math.random(),Math.random(),Math.random()));
                        parent.add(cube);
                    }
                }
            }
        }
    }
    var colors = [];
    var light, light2;
    function init() {
        var spMat = new THREE.MeshBasicMaterial( { color: 0x100afa } );
        var spMat2 = new THREE.MeshPhongMaterial({
            // light
            specular: '#1001aa',
            // intermediate
            color: '#1001ff',
            // dark
            emissive: '#006063',
            shininess: 5
        });
        for (var i = 10; i--;) {
            colors.push(Math.floor(Math.random()*0xFFFFFF));
        }

        container = document.createElement( 'div' );
        document.body.appendChild( container );

        raycaster = new THREE.Raycaster();

        renderer = new THREE.WebGLRenderer( { antialias: true } );

        camera = new THREE.PerspectiveCamera( 35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 25000 );
        camera.position.z = 200;

        scene = new THREE.Scene();


        partitionCube(new THREE.Vector3(0,0,0), 60, 2, scene);



        //scene.add(sphereObj);

        light2 = new THREE.DirectionalLight( 0x222222, 2 );
        light2.position.set( 10, 1, 15 );
        scene.add( light2 );

        light = new THREE.DirectionalLight( 0x222222, 2 );
        light.position.set( 1, 1, 1 );
        scene.add( light );

        var ambientLight = new THREE.AmbientLight(0x222222);
        scene.add(ambientLight);
        //scene.add()


        // RENDERER
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        renderer.setClearColor( 0xf2f7ff, 1 );
        renderer.autoClear = false;

        renderer.domElement.style.position = "relative";
        container.appendChild( renderer.domElement );

        controls = new THREE.OrbitControls( camera, renderer.domElement );

        // STATS1
        stats = new Stats();
        //container.appendChild( stats.domElement );

        document.addEventListener( 'mousemove', onDocumentMouseMove, false );

        lastTime = new Date().getTime();
    }

    var mouse = new THREE.Vector2();

    function onDocumentMouseMove(event) {

        event.preventDefault();

        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    }

    function makeSmaller() {
        if (INTERSECTED) {
            //INTERSECTED.material = null;
            var v = new THREE.Vector3(INTERSECTED.cust_pos.x + INTERSECTED.cust_size / 4,
                    INTERSECTED.cust_pos.y + INTERSECTED.cust_size / 4,
                    INTERSECTED.cust_pos.z + INTERSECTED.cust_size / 4);
            partitionCube(v, INTERSECTED.cust_size, 2, scene);
            scene.remove(INTERSECTED);
        }
        //INTERSECTED.geometry = null;
    }

    function onMouseDown( event ) {


        makeSmaller();
    }

    function animate() {
        var thisTime = new Date().getTime();
        var deltaTime = thisTime - lastTime;
        timePassed += deltaTime;

        requestAnimationFrame( animate );

        render();
        controls.update();
        stats.update();
        lastTime = thisTime;
    }

    var timeNewLookAt = 0;
    var nextUpdate = 0;
    var lookAt = new THREE.Vector3(0,0,0);
    var newLookAt = new THREE.Vector3(0,0,0);
    var oldLookAt = new THREE.Vector3(0,0,0);
    var lookAtDist = new THREE.Vector3(0,0,0);
    var theta = 45;
    var radius = 100;
    var radius2 = 100;
    var beta = 33;
    var gamma = 33;
    function render() {

        camera.position.x = 0;//+= ( mouseX - camera.position.x ) * .05;
        camera.position.y = -100;// THREE.Math.clamp( camera.position.y + ( - ( mouseY - 200 ) - camera.position.y ) * .05, 50, 1000 );
        camera.position.z = 100;

        theta += 0.1;
        beta += 0.5;
        gamma -= 0.8;

        camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
        camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
        camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );

        var x = radius2 * Math.sin( THREE.Math.degToRad( beta ) );
        var y = radius2 * Math.sin( THREE.Math.degToRad( beta ) );
        var z = radius2 * Math.cos( THREE.Math.degToRad( beta ) );

        light.position.set(x,y,z);

        var x = radius2 * Math.sin( THREE.Math.degToRad( gamma ) );
        var y = radius2 * Math.sin( THREE.Math.degToRad( gamma ) );
        var z = radius2 * Math.cos( THREE.Math.degToRad( gamma ) );

        light2.position.set(x,y,z);

        var tp = timePassed - timeNewLookAt;
        if (tp < 1000) {
            var x = (oldLookAt.x) + lookAtDist.x * (tp / 1000);
            var y = (oldLookAt.y) + lookAtDist.y * (tp / 1000);
            var z = (oldLookAt.z) + lookAtDist.z * (tp / 1000);

            lookAt = new THREE.Vector3(x,y,z);
        }
       // lookAt = new THREE.Vector3(mouse.x*50, mouse.y*50, 0);
        camera.lookAt( lookAt );

        //radius = 30+100*Math.pow(0.99999, timePassed);
        //camera.fov = 35*Math.pow(0.9998, timePassed);
        camera.fov = 35;
        camera.updateProjectionMatrix ();

        renderer.enableScissorTest( false );
        renderer.clear();
        renderer.enableScissorTest( true );

        renderer.setScissor( 0, 0, SCREEN_WIDTH - 2, SCREEN_HEIGHT );

        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects( scene.children );

        if ( intersects.length > 0 ) {
            var obj = intersects[ 0 ].object;
            scene.updateMatrixWorld();

            var vector = new THREE.Vector3();
            vector.setFromMatrixPosition( obj.matrixWorld );
            newLookAt = vector;
            oldLookAt = new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z);
            timeNewLookAt = timePassed;

            lookAtDist = new THREE.Vector3(newLookAt.x-lookAt.x,newLookAt.y-lookAt.y,newLookAt.z-lookAt.z);
            if ( INTERSECTED != intersects[ 0 ].object ) {

               if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );


                INTERSECTED = intersects[ 0 ].object;
                makeSmaller();
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.setHex( 0xff0000 );
                //INTERSECTED.material.emissive.setHex( Math.floor(Math.random()*0xFFFFFF) );

            }

        } else {
           // newLookAt = new THREE.Vector3(0,0,0);
          //  oldLookAt = new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z);
           // lookAtDist = new THREE.Vector3(newLookAt.x-lookAt.x,newLookAt.y-lookAt.y,newLookAt.z-lookAt.z);
            if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

            INTERSECTED = null;

        }

        renderer.render( scene, camera );

    }

    function update() {
        controls.update();
    }

    document.addEventListener('mousedown', function (e) {
        onMouseDown(e);
    }, false);
    document.addEventListener("DOMContentLoaded", function(event) {
        init();
        animate();
    });
})();