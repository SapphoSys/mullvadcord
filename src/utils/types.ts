export interface TailscaleDevice {
	addresses: string[];
	authorized: boolean;
	blocksIncomingConnections: boolean;
	clientVersion: string;
	created: string;
	expires: string;
	hostname: string;
	id: string;
	isExternal: boolean;
	keyExpiryDisabled: boolean;
	lastSeen: string;
	machineKey: string;
	name: string;
	nodeId: string;
	nodeKey: string;
	os: string;
	tailnetLockError: string;
	tailnetLockKey: string;
	updateAvailable: boolean;
	user: string;
}

export interface TailscaleDevicesResponse {
	devices: TailscaleDevice[];
}

export interface TailscaleApiTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
}

export interface MullvadNodeAttr {
	target: string[];
	attr: string[];
}

export interface MullvadAcl {
	nodeAttrs?: MullvadNodeAttr[];
}
