import { factorDeEscala } from "./constantes";
import { k } from "./kaboomContexto";
import { mostrarDialogo } from "./utilidades";
import { confEscaladoCamara } from "./utilidades";
import { dataDialogos } from "./constantes";

k.loadSprite("spritesheet", "./spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "quieto-abajo": 936,
    "caminar-abajo": {from: 936, to: 939, loop: true, speed: 8},
    "quieto-de-lado": 975,
    "caminar-de-lado": {from: 975, to: 978, loop: true, speed: 8},
    "quieto-arriba": 1014,
    "caminar-arriba": {from: 1014, to: 1017, loop: true, speed: 8},
  }
});

k.loadSprite("mapa", "./custom-map-extended.png");

k.setBackground(k.Color.fromHex("0c2461"));

k.scene("principal", async () => {
  const mapData = await (await fetch("./custom-map-extended.json")).json();
  const capas = mapData.layers;
  
  const mapa = k.add([k.sprite("mapa"), k.pos(0), k.scale(factorDeEscala)]);
  const personaje = k.make([
    k.sprite("spritesheet", {anim:"quieto-abajo"}),
    k.area({
      shape: new k.Rect(k.vec2(0,3), 10, 10)
    }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(factorDeEscala),
    {
      velocidad: 250,
      direccion: "abajo",
      estaEnDialogo: false
    },
    "personaje"
  ]);

  for(const capa of capas) {
    if(capa.name === "boundaries") {
      for(const limite of capa.objects) {
          mapa.add([
            k.area({
              shape: new k.Rect(k.vec2(0), limite.width, limite.height)
            }),
            k.body({isStatic: true}),
            k.pos(limite.x, limite.y),
            limite.name
          ]);

          if(limite.name) {
            personaje.onCollide(limite.name, () => {
              personaje.estaEnDialogo = true;

              if (personaje.direccion === "abajo") personaje.play("quieto-abajo");
              else if (personaje.direccion === "arriba") personaje.play("quieto-arriba");
              else personaje.play("quieto-de-lado");

              mostrarDialogo(dataDialogos[limite.name], () => {
                personaje.estaEnDialogo = false;
                document.getElementById("juego")?.focus();
              });
            })
          }
      }
      continue;
    }

    if(capa.name === "spawnpoints") {
      for(const entidad of capa.objects) {
        if(entidad.name === "player") {
          personaje.pos = k.vec2(
            (mapa.pos.x + entidad.x) * factorDeEscala,
            (mapa.pos.y + entidad.y) * factorDeEscala
          );
          k.add(personaje);
          continue;
        }
      }
    }
  }

  confEscaladoCamara(k);

  k.onResize(() => {
    confEscaladoCamara(k);
  });

  k.onUpdate(() => {
    k.camPos(personaje.pos.x, personaje.pos.y + 100);

    if (personaje.estaEnDialogo) return;

    let dir = k.vec2(0, 0);

    // Inputs de dirección
    if (k.isKeyDown("left")) dir.x -= 1;
    if (k.isKeyDown("right")) dir.x += 1;
    if (k.isKeyDown("up")) dir.y -= 1;
    if (k.isKeyDown("down")) dir.y += 1;

    if (!dir.eq(k.vec2(0, 0))) {
      dir = dir.unit();

      personaje.move(dir.scale(personaje.velocidad));

      // Determinar la animación a ejecutar
      let animacion = "";
      let nuevaDireccion = personaje.direccion;

      if (Math.abs(dir.y) > Math.abs(dir.x)) { // Movimiento más horizontal que vertical
        if (dir.y < 0) {
          animacion = "caminar-arriba";
          nuevaDireccion = "arriba";
        } else {
          animacion = "caminar-abajo";
          nuevaDireccion = "abajo";
        }
      } else { // Movimiento mas vertical que horizontal
        animacion = "caminar-de-lado";
        if (dir.x > 0) {
          personaje.flipX = false;
          nuevaDireccion = "derecha";
        } else {
          personaje.flipX = true;
          nuevaDireccion = "izquierda";
        }
      }

      // Solo cambiar animación si es diferente a la animación actual
      if (nuevaDireccion !== personaje.direccion || personaje.curAnim() !== animacion) {
        personaje.play(animacion);
        personaje.direccion = nuevaDireccion;
      }

    } else {
      // Si no hay movimiento aplicamos animación de estar quietos...
      if(k.isKeyReleased()) {
        if (personaje.direccion == "abajo") personaje.play("quieto-abajo");
        if (personaje.direccion == "arriba") personaje.play("quieto-arriba");
        if (personaje.direccion == "derecha" || personaje.direccion == "izquierda") personaje.play("quieto-de-lado");
      }
    }
  });

  k.onMouseDown((btnMouse) => { // configuramos movimiento con el mouse...
    if (btnMouse !== "left" || personaje.estaEnDialogo) return;
    const posicionMouseMundo = k.toWorld(k.mousePos());
    personaje.moveTo(posicionMouseMundo, personaje.velocidad);

    const anguloMouse = personaje.pos.angle(posicionMouseMundo);
    const limiteInferior = 50;
    const limiteSuperior = 125;

    if ( // aplicar animacion de caminar hacia arriba si el angulo en el que se encuentra el mouse es > 50 y < 125
      anguloMouse > limiteInferior &&
      anguloMouse < limiteSuperior &&
      personaje.curAnim() != "caminar-arriba"
    ) {
      personaje.play("caminar-arriba");
      personaje.direccion = "arriba";
      return;
    }

    if ( // aplicar animacion de caminar hacia abajo si el angulo en el que se encuentra el mouse es < -50 y > -125
      anguloMouse < -limiteInferior &&
      anguloMouse > -limiteSuperior &&
      personaje.curAnim() != "caminar-abajo"
    ) {
      personaje.play("caminar-abajo");
      personaje.direccion = "abajo";
      return;
    }

    if (Math.abs(anguloMouse) > limiteSuperior) { // aplicar animacion de caminar hacia derecha si el angulo absoluto en el que se encuentra el mouse es > 50
      personaje.flipX = false;
      if (personaje.curAnim() != "caminar-de-lado") personaje.play("caminar-de-lado");
      personaje.direccion = "derecha";
      return;
    }

    if (Math.abs(anguloMouse) < limiteInferior) {
      personaje.flipX = true;
      if (personaje.curAnim() != "caminar-de-lado") personaje.play("caminar-de-lado");
      personaje.direccion = "izquierda";
      return;
    }

  });

  k.onMouseRelease(() => {
    if (personaje.direccion == "abajo") {
      personaje.play("quieto-abajo");
      return;
    }
    if (personaje.direccion == "arriba") {
      personaje.play("quieto-arriba");
      return;
    }
    personaje.play("quieto-de-lado");
  });

});

k.go("principal");