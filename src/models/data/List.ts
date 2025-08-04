import { IList } from '../../types/data/List';
import { IList as IRawList } from '../../types/raw/base/List';

import { User } from './User';

/**
 * The details of a single Twitter List.
 *
 * @public
 */
export class List implements IList {
	/** The raw list details. */
	private readonly _raw: IRawList;

	public createdAt: string;
	public createdBy: User;
	public description?: string;
	public id: string;
	public isFollowing: boolean;
	public isMember: boolean;
	public memberCount: number;
	public name: string;
	public subscriberCount: number;

	/**
	 * @param list - The raw list details.
	 */
	public constructor(list: IRawList) {
		this._raw = { ...list };
		this.id = list.id_str;
		this.name = list.name;
		this.createdAt = new Date(list.created_at).toISOString();
		this.description = list.description.length ? list.description : undefined;
		this.isFollowing = list.following;
		this.isMember = list.is_member;
		this.memberCount = list.member_count;
		this.subscriberCount = list.subscriber_count;
		this.createdBy = new User(list.user_results.result);
	}

	/** The raw list details. */
	public get raw(): IRawList {
		return { ...this._raw };
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IList {
		return {
			createdAt: this.createdAt,
			createdBy: this.createdBy,
			description: this.description,
			id: this.id,
			isFollowing: this.isFollowing,
			isMember: this.isMember,
			memberCount: this.memberCount,
			name: this.name,
			subscriberCount: this.subscriberCount,
		};
	}
}
