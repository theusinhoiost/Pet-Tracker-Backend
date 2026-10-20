import { Test, TestingModule } from '@nestjs/testing';
import { WeightService } from './weight.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Weight } from './entities/weight.entity';
import { Pet } from 'src/pet/entities/pet.entity';

describe('WeightService', () => {
  let service: WeightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeightService,
        {
          provide: getRepositoryToken(Weight),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WeightService>(WeightService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
