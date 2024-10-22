import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, AnimationController, Animation, AlertController } from '@ionic/angular';
import * as QRCode from 'qrcode';
import { QrModalComponent } from '../qr-modal/qr-modal.component';

interface Clases {
  [key: string]: {
    [key: string]: string[];
  };
}

@Component({
  selector: 'app-profesor',
  templateUrl: 'profesor.page.html',
  styleUrls: ['profesor.page.scss'],
})
export class ProfesorPage implements OnInit {

  tema: string = 'Cambiar a Oscuro';
  qrCodeData?: string;
  animacionActiva: boolean = false;
  iconoNotificacion: string = 'mail-unread-outline';
  private animation: Animation | undefined;

  usuarioActual: any;

  // Propiedades para manejar selecciones
  selectedDay: string = '';
  selectedClass: string = '';
  availableClasses: string[] = [];
  availableSections: string[] = [];
  isClassSelectDisabled: boolean = true; // Nueva propiedad para deshabilitar el select

  // Definición de las clases
  clases: Clases = {
    Programación: {
      "003": ['Lunes', 'Martes'],
      "004": ['Lunes', 'Viernes'],
      "005": ['Martes', 'Miercoles'],
    },
    Arquitectura: {
      "009": ['Lunes'],
      "001": ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
    },
    Matemáticas: {
      "001": ['Jueves'],
      "003": ['Lunes'],
      "004": ['Martes'],
    },
  };

  constructor(
    private router: Router,
    private modalController: ModalController,
    private animCtrl: AnimationController,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    this.aplicarTema();
    this.animarNotificaciones();

    const usuario = localStorage.getItem('usuarioActual');
    if (usuario) {
      this.usuarioActual = JSON.parse(usuario);
    }
  }

  aplicarTema() {
    const savedTema = localStorage.getItem('tema');
    if (savedTema === 'oscuro') {
      document.documentElement.style.setProperty("--cf-fondo", "#002020");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#0F4242");
      this.tema = 'Cambiar a Claro';
    } else {
      document.documentElement.style.setProperty("--cf-fondo", "#89B8B8");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#BEDBDB");
      this.tema = 'Cambiar a Oscuro';
    }
  }

  cambiarTema() {
    if (this.tema === 'Cambiar a Oscuro') {
      document.documentElement.style.setProperty("--cf-fondo", "#002020");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#0F4242");
      localStorage.setItem('tema', 'oscuro');
      this.tema = 'Cambiar a Claro';
    } else {
      document.documentElement.style.setProperty("--cf-fondo", "#89B8B8");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#BEDBDB");
      localStorage.setItem('tema', 'claro');
      this.tema = 'Cambiar a Oscuro';
    }
  }

  salir() {
    this.router.navigate(['/login']);
  }

  async generarCodigoQR() {
    if (!this.selectedClass || !this.selectedDay || this.availableSections.length === 0) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Por favor, selecciona un día y una clase válidos antes de generar el código QR.',
        buttons: ['Aceptar']
      });
      await alert.present();
      return; // Salir si no hay datos válidos
    }

    const codigoQRData = {
      clase: this.selectedClass,
      dia: this.selectedDay,
      seccion: this.availableSections[0] // Asumiendo que solo muestras la primera sección seleccionada
    };

    try {
      const qrDataString = JSON.stringify(codigoQRData); // Convertir el objeto a una cadena
      this.qrCodeData = await QRCode.toDataURL(qrDataString);
      
      const modal = await this.modalController.create({
        component: QrModalComponent,
        componentProps: { codigoQR: this.qrCodeData }
      });
      await modal.present();
    } catch (error) {
      console.error('Error al generar el código QR', error);
    }
  }

  animarNotificaciones() {
    if (this.animacionActiva) return;

    const icon = document.querySelector('.icono-notificacion')!;
    this.animation = this.animCtrl.create()
      .addElement(icon)
      .duration(500)
      .iterations(Infinity)
      .fromTo('transform', 'scale(1)', 'scale(1.2)')
      .fromTo('transform', 'scale(1.2)', 'scale(1)');

    this.animation.play();
    this.animacionActiva = true;
  }

  detenerAnimacion() {
    if (this.animation) {
      this.animation.stop();
      this.animacionActiva = false;
      this.iconoNotificacion = 'mail-outline';

      setTimeout(() => {
        this.iconoNotificacion = 'mail-unread-outline';
        this.animarNotificaciones();
      }, 3000);
    }
  }

  manejarClickNotificaciones() {
    this.detenerAnimacion();
  }

  onDaySelect(event: any) {
    this.selectedDay = event.detail.value; // Asignar el día seleccionado
    this.updateAvailableClasses(); // Actualizar las clases disponibles
    this.isClassSelectDisabled = this.availableClasses.length === 0; // Habilitar/deshabilitar el select de clase
    // Reiniciar selección de clase y secciones
    this.resetSelections();
  }

  onClassSelect(event: any) {
    this.selectedClass = event.detail.value; // Asignar la clase seleccionada
    this.updateAvailableSections();
  }

  updateAvailableClasses() {
    this.availableClasses = Object.keys(this.clases).filter(subject => {
      return Object.keys(this.clases[subject]).some(section => {
        return this.clases[subject][section].includes(this.selectedDay);
      });
    });

    // Mostrar alerta si no hay clases disponibles para el día seleccionado
    if (this.availableClasses.length === 0) {
      this.presentAlert();
    }
  }

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Atención',
      message: 'Este día no posees clases.',
      buttons: ['Aceptar']
    });

    await alert.present();
  }

  resetSelections() {
    this.selectedClass = ''; // Reiniciar la clase seleccionada
    this.availableSections = []; // Reiniciar secciones disponibles
  }

  updateAvailableSections() {
    if (this.selectedClass) {
      this.availableSections = this.getSectionsForClassAndDay(this.selectedClass, this.selectedDay);
    } else {
      this.availableSections = []; // Reiniciar secciones si no hay clase seleccionada
    }
  }

  getSectionsForClassAndDay(subject: string, day: string) {
    const sections: string[] = [];
    if (this.clases[subject]) {
      for (const section in this.clases[subject]) {
        if (this.clases[subject][section].includes(day)) {
          sections.push(section);
        }
      }
    }
    return sections;
  }
}
