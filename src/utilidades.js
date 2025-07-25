export function mostrarDialogo(texto, alMostrarFinalizar) {

  const dialogoIU = document.getElementById("contenedor-textbox");
  const dialogo = document.getElementById("dialogo");

  dialogoIU.style.display = "block";

  let index = 0;
  let textoActual = "";

  const intervalRef = setInterval(() => {
    if(index < texto.length) {
      textoActual += texto[index];
      dialogo.innerHTML = textoActual;
      index++;
      return;
    }
    clearInterval(intervalRef);
  }, 5);

  const btnCerrar = document.getElementById("cerrar");
  
  function btnClickAlCerrar() {
    alMostrarFinalizar();
    dialogoIU.style.display = "none";
    dialogo.innerHTML = "";
    clearInterval(intervalRef);
    btnCerrar.removeEventListener("btnClickAlCerrar");
  }
  
  btnCerrar.addEventListener("click", btnClickAlCerrar);

  document.addEventListener('keydown', function(event) { // cerramos dialogo si se presiona la tecla Escape 
  if (event.key === 'Escape' || event.keyCode === 27) {
      btnClickAlCerrar();
    }
  });
}

export function confEscaladoCamara(k) {
  const resizeFactor = k.width() / k.height();
  if (resizeFactor < 1) {
    k.camScale(k.vec2(1));
    return;
  }
  k.camScale(k.vec2(1.5));

}