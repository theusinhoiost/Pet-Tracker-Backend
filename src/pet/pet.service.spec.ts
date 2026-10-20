import { Test, TestingModule } from '@nestjs/testing';
import { PetService } from './pet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { S3Service } from 'src/common/s3/s3.service';

describe('PetService', () => {
  let service: PetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetService,
        {
          provide: getRepositoryToken(Pet),
          useValue: {},
        },
        {
          provide: S3Service,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PetService>(PetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
