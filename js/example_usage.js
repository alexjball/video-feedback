feedback = new VF.Feedback(n_delay = 5);

feedbackScene = new THREE.Scene();

T_F = new VF.AffineTransform(rotation = pi / 3, scale = .5, translatiion = [1, 0]);

S_x = new VF.MirrorSymmetry(angle = pi / 2);

TV = new VF.TV(center = [0, 0], width = 1, height = .5);

feedback.add(feedbackScene, T_F, S_x, TV);
feedback.add_loop(feedbackScene, T_F, S_x, TV);

feedbackScene.add(TV);

viewScene = new THREE.Scene();
viewScene.add(feedbackScene);
viewScene.add(get_outline());

camera = new THREE.OrthographicCamera();

viewScene.add(camera);

render();