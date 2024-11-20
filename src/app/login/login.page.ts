import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, AnimationController, LoadingController } from '@ionic/angular';

// Definir la interfaz para Usuario
interface Usuario {
  nombre: string;
  email: string;
  clave: string;
  rol: string;
  rut: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  usuarios: Usuario[] = [
    {
      nombre: "Fernando Enrique Sepulveda",
      email: "fernando@gmail.com",
      clave: "fer123",
      rol: "profesor",
      rut: "12.345.678-9"
    },
    {
      nombre: "Natalia Sánchez Herrada",
      email: "na.sanchezh@duocuc.cl",
      clave: "natu123",
      rol: "alumno",
      rut: "21.690.023-5"
    }
  ];

  icono = "oscuro";
  isModalOpen = false;
  registrarModal = false;
  email = "";
  clave = "";
  nombre = "";
  rol = "";
  rut = "";

  constructor(
    private router: Router,
    private anim: AnimationController,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) { }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  // Método para iniciar sesión
  async login() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando...',
    });
    await loading.present();

    const usuariosGuardados = localStorage.getItem('usuarios');
    const usuarios: Usuario[] = usuariosGuardados ? JSON.parse(usuariosGuardados) : this.usuarios;

    const usuarioEncontrado = usuarios.find((usuario: Usuario) =>
      usuario.email === this.email && usuario.clave === this.clave
    );

    await loading.dismiss();

    if (usuarioEncontrado) {
      localStorage.setItem('usuarioActual', JSON.stringify(usuarioEncontrado));
      if (usuarioEncontrado.rol === 'profesor') {
        this.router.navigate(['/profesor']);
      } else {
        this.router.navigate(['/home']);
      }
    } else {
      console.log("Datos incorrectos!");
      this.showAlert('Alerta!', 'El usuario que ha ingresado no se ha podido encontrar. Por favor, verifique los datos.');
    }
  }

  // Mostrar alertas en la interfaz
  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header: header,
      message: message,
      buttons: [ {
        text: 'CONTINUAR',
        cssClass: 'alerta-button-diseno'
      }],
      cssClass: "alerta-diseno"
    });
    await alert.present();
  }

  // Método para restablecer la contraseña
  async resetPass() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando...',
    });
    await loading.present();

    const usuariosGuardados = localStorage.getItem('usuarios');
    const usuarios: Usuario[] = usuariosGuardados ? JSON.parse(usuariosGuardados) : this.usuarios;
    const usuarioEncontrado = usuarios.find((u: Usuario) => u.email === this.email);

    if (usuarioEncontrado) {
      let nueva = Math.random().toString(36).slice(-6);  // Genera una nueva contraseña aleatoria
      usuarioEncontrado.clave = nueva;  // Asigna la nueva contraseña

      // Actualiza el localStorage con la nueva contraseña
      localStorage.setItem('usuarios', JSON.stringify(usuarios));

      let body = {
        "nombre": usuarioEncontrado.nombre,
        "app": "RegistrarApp",
        "clave": nueva,
        "email": usuarioEncontrado.email
      };

      // Enviar correo de recuperación
      this.http.post("https://myths.cl/api/reset_password.php", body)
        .subscribe(async (data) => {
          console.log(data);
          loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Éxito',
            message: 'El correo ha sido enviado con éxito.',
            buttons: [ {
              text: 'CONTINUAR',
              cssClass: 'alerta-button-diseno'
            }],
            cssClass: "alerta-diseno"
          });
          await alert.present();
        }, async error => {
          console.error("Error al enviar el correo:", error);
          loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: 'Ocurrió un error al enviar el correo. Inténtalo de nuevo.',
            buttons: ['OK'],
          });
          await alert.present();
        });
    } else {
      console.log("Usuario no encontrado!");
      loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Usuario no encontrado!',
        buttons: [{
          text: 'CONTINUAR',
          cssClass: 'alerta-button-diseno'
        }],
        cssClass: "alerta-diseno"
      });
      await alert.present();
    }
  }

  // Registrar un nuevo usuario
  registrarUsuario() {
    // Verificar si todos los campos están completos
    if (!this.nombre || !this.email || !this.clave || !this.rol || !this.rut) {
      this.showAlert('Alerta', 'Por favor, complete todos los campos.');
      return;
    }

    const nuevoUsuario: Usuario = {
      nombre: this.nombre,
      email: this.email,
      clave: this.clave,
      rol: this.rol,
      rut: this.rut
    };

    let usuariosGuardados = localStorage.getItem('usuarios');
    let usuarios: Usuario[] = usuariosGuardados ? JSON.parse(usuariosGuardados) : this.usuarios;

    usuarios.push(nuevoUsuario);

    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    this.resetFields();
    this.cerrarRegistrarModal();
    this.showAlert('Éxito', 'Usuario registrado exitosamente.');
  }

  // Abrir el modal de registro
  abrirRegistrarModal() {
    this.registrarModal = true;
  }

  // Cerrar el modal de registro
  cerrarRegistrarModal() {
    this.registrarModal = false;
  }

  // Limpiar los campos del formulario
  resetFields() {
    this.email = "";
    this.clave = "";
    this.nombre = "";
    this.rol = "";
    this.rut = "";
  }

  // Cambiar entre temas claro y oscuro
  cambiarTema() {
    if (this.icono === "oscuro") {
      document.documentElement.style.setProperty("--cf-fondo", "#002020");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#0F4242");
      document.documentElement.style.setProperty("--icono-alineacion", "flex-end");

      localStorage.setItem('tema', 'oscuro');
      this.icono = "claro";
    } else {
      document.documentElement.style.setProperty("--cf-fondo", "#89B8B8");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#BEDBDB");
      document.documentElement.style.setProperty("--icono-alineacion", "flex-start");

      localStorage.setItem('tema', 'claro');
      this.icono = "oscuro";
    }
  }

  // Configurar tema al inicio
  ngOnInit() {
    const savedTema = localStorage.getItem('tema');
    if (savedTema === 'oscuro') {
      document.documentElement.style.setProperty("--cf-fondo", "#002020");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#0F4242");
      document.documentElement.style.setProperty("--icono-alineacion", "flex-end");
      this.icono = "claro";
    } else {
      document.documentElement.style.setProperty("--cf-fondo", "#89B8B8");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#BEDBDB");
      document.documentElement.style.setProperty("--icono-alineacion", "flex-start");
      this.icono = "oscuro";
    }

    this.anim.create()
      .addElement(document.querySelector("#logo")!)
      .duration(2000)
      .iterations(Infinity)
      .fromTo("transform", "scale(1.1) rotate(-1000deg)", "scale(0.9) rotate(0deg)")
      .direction("alternate-reverse")
      .play();
  }

  // Restablecer campos al entrar en la vista
  ionViewWillEnter() {
    this.resetFields();
  }
}
