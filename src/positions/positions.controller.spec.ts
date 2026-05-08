import { Test, TestingModule } from '@nestjs/testing';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

const positionsServiceMock = {
  findAll: jest.fn(),
  findTree: jest.fn(),
  findOne: jest.fn(),
  findChildren: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('PositionsController', () => {
  let controller: PositionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionsController],
      providers: [
        {
          provide: PositionsService,
          useValue: positionsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<PositionsController>(PositionsController);
    jest.clearAllMocks();
  });

  it('should call findAll with parsed query flags', async () => {
    positionsServiceMock.findAll.mockResolvedValueOnce([]);
    await controller.findAll('true', 'false');
    expect(positionsServiceMock.findAll).toHaveBeenCalledWith({
      includeChildren: true,
      rootOnly: false,
    });
  });

  it('should call create with payload', async () => {
    const payload = { name: 'CEO', description: 'Top role' };
    positionsServiceMock.create.mockResolvedValueOnce(payload);
    await controller.create(payload);
    expect(positionsServiceMock.create).toHaveBeenCalledWith(payload);
  });
});
