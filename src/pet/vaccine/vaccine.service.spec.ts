import { Test, TestingModule } from '@nestjs/testing';
import { VaccineService } from './vaccine.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vaccine } from './entities/vaccine.entity';
import { Pet } from 'src/pet/entities/pet.entity';

describe('VaccineService', () => {
  let service: VaccineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaccineService,
        {
          provide: getRepositoryToken(Vaccine),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<VaccineService>(VaccineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
