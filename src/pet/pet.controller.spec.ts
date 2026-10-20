import { Test, TestingModule } from '@nestjs/testing';
import { PetController } from './pet.controller';
import { PetService } from './pet.service';

describe('PetController', () => {
  let controller: PetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetController],
      providers: [
        {
          provide: PetService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PetController>(PetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
