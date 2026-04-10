import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return application status', () => {
      const status = appController.obtenerEstado();

      expect(status.name).toBe('backend-trazabilidad-municipal');
      expect(status.modulo).toBe('trazabilidad-municipal');
      expect(status.status).toBe('ok');
      expect(typeof status.fechaHora).toBe('string');
    });
  });
});
