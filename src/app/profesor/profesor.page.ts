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

  selectedDay: string = '';
  selectedClass: string = '';
  selectedSection: string = '';  // Variable para almacenar la sección seleccionada
  availableClasses: string[] = [];
  availableSections: string[] = [];
  isClassSelectDisabled: boolean = true;

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
    if (!this.selectedClass || !this.selectedDay || !this.selectedSection) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Por favor, selecciona un día, una clase y una sección válidos antes de generar el código QR.',
        buttons: ['Aceptar']
      });
      await alert.present();
      return;
    }

    const codigoQRData = {
      clase: this.selectedClass,
      dia: this.selectedDay,
      seccion: this.selectedSection  // Ahora se utilizará la sección seleccionada correctamente
    };

    try {
      const qrDataString = JSON.stringify(codigoQRData);
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
    }
  }

  manejarClickNotificaciones() {
    this.iconoNotificacion = 'mail-outline';
    this.detenerAnimacion();
  }

  onDaySelect(event: any) {
    this.selectedDay = event.detail.value;
    this.updateAvailableClasses();
    this.selectedClass = '';  // Reinicia la clase seleccionada
    this.selectedSection = '';  // Reinicia la sección seleccionada
  }

  updateAvailableClasses() {
    this.availableClasses = [];
    for (const clase in this.clases) {
      for (const seccion in this.clases[clase]) {
        if (this.clases[clase][seccion].includes(this.selectedDay)) {
          this.availableClasses.push(clase);
          break;
        }
      }
    }
    this.isClassSelectDisabled = this.availableClasses.length === 0;
  }

  onClassSelect(event: any) {
    this.selectedClass = event.detail.value;
    this.updateAvailableSections();
    this.selectedSection = '';  // Reinicia la sección seleccionada
  }

  updateAvailableSections() {
    if (this.selectedClass && this.clases[this.selectedClass]) {
      this.availableSections = Object.keys(this.clases[this.selectedClass]).filter(section => 
        this.clases[this.selectedClass][section].includes(this.selectedDay)
      );
    } else {
      this.availableSections = [];
    }
  }
}
