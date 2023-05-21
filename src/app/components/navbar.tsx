'use client';
import { useState } from "react";
import { Kuber, CIP30Wallet, CIP30ProviderProxy, WalletBalance } from "kuber-client";
import UserAssets from "./userAssets";

const Navbar = () => {
    const [installedWallets, setInstalledWallets] = useState<CIP30ProviderProxy[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [connectedWallet, setConnectedWallet] = useState<CIP30ProviderProxy | null>(null);

    const toggleDropdown = async () => {
        if (!isDropdownOpen) {
            try {
                const kuber = new Kuber('https://preview.kuberide.com');
                const providers = await CIP30Wallet.listProviders();
                const mw = providers[0]
                if (!providers) {
                    window.alert('Please Install CIP-30 Compatible Wallet in Your Browser');
                    return;
                }
                setInstalledWallets(providers);
            } catch (error) {
                console.error("Error fetching installed wallets:", error);
            }
        }
        setIsDropdownOpen(!isDropdownOpen);
    };

    const enableWallet = async (wallet: CIP30ProviderProxy) => {
        try {
            await wallet.enable();
            setConnectedWallet(wallet);
        } catch (error) {
            console.error("Error enabling wallet:", error);
        }
    };

    const disconnectWallet = () => {
        setConnectedWallet(null);
    };

    return (
        <>
            <div className="navbar">
                <div className="nfterra">
                    ℂ ℕ 𝔽 𝕋 &nbsp;
                </div>
                <div className="divContainer">
                    <div>
                        <button className={`connectWallet ${connectedWallet ? 'disconnect' : ''}`} onClick={connectedWallet ? disconnectWallet : toggleDropdown}>
                            {connectedWallet ? "Disconnect" : "Connect Wallet"}
                        </button>
                    </div>
                </div>
                {isDropdownOpen && (
                    <div className="walletContainer">
                        <div>
                            <table className="slide-in-content" align="right" cellPadding={10} style={{ textAlign: "center" }}>
                                <tr>
                                    {installedWallets.length == 0 &&
                                        <td colSpan={2} style={{ textAlign: "center" }} className="walletName">
                                            <p>Please install CIP-30 Compatible Wallet in your Browser</p>
                                        </td>
                                    }
                                    {connectedWallet && (
                                        <><td className="walletName">
                                            <img style={{ width: '30px', height: '30px' }} src={connectedWallet.icon} alt={connectedWallet.name} />
                                        </td></>
                                    )}
                                    {!connectedWallet &&
                                        installedWallets.map((wallet) => (
                                            <><><><td className="walletName">
                                                <img style={{ width: '30px', height: '30px' }} src={wallet.icon} alt={wallet.name} onClick={() => enableWallet(wallet)} />
                                            </td><td className="walletName"><p onClick={() => enableWallet(wallet)}>{wallet.name} </p></td></><td>&nbsp;</td></></>
                                        ))}
                                    <td>&nbsp;</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {connectedWallet &&
                <UserAssets connectedWallet={connectedWallet} />
            }
        </>
    );
};

export default Navbar;
