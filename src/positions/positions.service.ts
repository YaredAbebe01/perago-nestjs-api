import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PositionEntity } from '../entities/position.entity';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

export type PositionTreeNode = {
  id: string;
  name: string;
  description: string;
  email: string | null;
  parentId: string | null;
  children: PositionTreeNode[];
};

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(PositionEntity)
    private readonly positionsRepo: Repository<PositionEntity>,
  ) {}

  async create(payload: CreatePositionDto): Promise<PositionEntity> {
    if (payload.parentId) {
      await this.ensureExists(payload.parentId);
    }

    const position = this.positionsRepo.create({
      name: payload.name.trim(),
      description: payload.description.trim(),
      email: payload.email ?? null,
      parentId: payload.parentId ?? null,
    });

    return this.positionsRepo.save(position);
  }

  async update(id: string, payload: UpdatePositionDto): Promise<PositionEntity> {
    const position = await this.ensureExists(id);

    if (payload.parentId !== undefined) {
      if (payload.parentId === id) {
        throw new ConflictException('Position cannot be its own parent.');
      }
      if (payload.parentId) {
        await this.ensureExists(payload.parentId);
        await this.ensureNoCycle(id, payload.parentId);
      }
      position.parentId = payload.parentId ?? null;
    }

    if (payload.name !== undefined) {
      position.name = payload.name.trim();
    }

    if (payload.description !== undefined) {
      position.description = payload.description.trim();
    }

    if (payload.email !== undefined) {
      position.email = payload.email;
    }

    return this.positionsRepo.save(position);
  }

  async findAll(options: {
    includeChildren: boolean;
    rootOnly: boolean;
  }): Promise<PositionEntity[] | PositionTreeNode[]> {
    if (options.includeChildren) {
      const positions = await this.positionsRepo.find();
      return this.buildTree(positions);
    }

    if (options.rootOnly) {
      return this.positionsRepo.find({ where: { parentId: IsNull() } });
    }

    return this.positionsRepo.find();
  }

  async findTree(): Promise<PositionTreeNode[]> {
    const positions = await this.positionsRepo.find();
    return this.buildTree(positions);
  }

  async findOne(id: string, includeChildren: boolean): Promise<PositionEntity | PositionTreeNode> {
    if (!includeChildren) {
      return this.ensureExists(id);
    }

    const positions = await this.positionsRepo.find();
    const tree = this.buildTree(positions);
    const node = this.findNode(tree, id);

    if (!node) {
      throw new NotFoundException('Position not found.');
    }

    return node;
  }

  async findChildren(id: string): Promise<PositionEntity[]> {
    await this.ensureExists(id);
    return this.positionsRepo.find({ where: { parentId: id } });
  }

  async remove(id: string): Promise<void> {
    const position = await this.ensureExists(id);
    const childrenCount = await this.positionsRepo.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new ConflictException('Position has children and cannot be deleted.');
    }

    await this.positionsRepo.remove(position);
  }

  private async ensureExists(id: string): Promise<PositionEntity> {
    const position = await this.positionsRepo.findOne({ where: { id } });
    if (!position) {
      throw new NotFoundException('Position not found.');
    }
    return position;
  }

  private async ensureNoCycle(id: string, newParentId: string): Promise<void> {
    const positions = await this.positionsRepo.find({
      select: ['id', 'parentId'],
    });
    const lookup = new Map(positions.map((item) => [item.id, item.parentId]));
    let current = newParentId;

    while (current) {
      if (current === id) {
        throw new ConflictException('Position hierarchy cycle detected.');
      }
      current = lookup.get(current) ?? null;
    }
  }

  private buildTree(positions: PositionEntity[]): PositionTreeNode[] {
    const nodes = new Map<string, PositionTreeNode>();
    for (const position of positions) {
      nodes.set(position.id, {
        id: position.id,
        name: position.name,
        description: position.description,
        email: position.email,
        parentId: position.parentId,
        children: [],
      });
    }

    const roots: PositionTreeNode[] = [];
    for (const node of nodes.values()) {
      if (node.parentId && nodes.has(node.parentId)) {
        nodes.get(node.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    this.sortTree(roots);
    return roots;
  }

  private sortTree(nodes: PositionTreeNode[]): void {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) {
      if (node.children.length > 0) {
        this.sortTree(node.children);
      }
    }
  }

  private findNode(nodes: PositionTreeNode[], id: string): PositionTreeNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      const found = this.findNode(node.children, id);
      if (found) {
        return found;
      }
    }
    return null;
  }
}
